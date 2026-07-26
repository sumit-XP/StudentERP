import pool from "../../config/db.js";

/**
 * Bank Reconciliation Controller (Task 7)
 * Handles bank transaction imports and fee payment matching
 */

/**
 * Import bank transactions
 * POST /api/finance/bank-transactions
 */
export const importBankTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;
    const { userId } = req.user;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "transactions array is required" });
    }

    const imported = [];
    const errors = [];

    for (const txn of transactions) {
      try {
        const {
          transaction_date,
          description,
          amount,
          type,
          reference_number,
          bank_account
        } = txn;

        if (!transaction_date || !description || !amount || !type) {
          errors.push({ txn, error: "Missing required fields" });
          continue;
        }

        if (!['credit', 'debit'].includes(type)) {
          errors.push({ txn, error: "type must be 'credit' or 'debit'" });
          continue;
        }

        const result = await pool.query(
          `INSERT INTO bank_transactions 
           (transaction_date, description, amount, type, reference_number, bank_account, raw_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [transaction_date, description, amount, type, reference_number || null, bank_account || null, JSON.stringify(txn)]
        );

        imported.push(result.rows[0]);
      } catch (err) {
        errors.push({ txn, error: err.message });
      }
    }

    res.status(201).json({
      message: `Imported ${imported.length} transactions`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Import bank transactions error:", error);
    res.status(500).json({ error: "Failed to import bank transactions" });
  }
};

/**
 * Get bank transactions with filters
 * GET /api/finance/bank-transactions
 */
export const getBankTransactions = async (req, res) => {
  try {
    const { status, type, from_date, to_date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT bt.*, 
             fp.amount_paid as matched_amount,
             fp.payment_date as matched_payment_date,
             u.name as matched_by_name
      FROM bank_transactions bt
      LEFT JOIN fee_payments fp ON bt.matched_fee_id = fp.id
      LEFT JOIN users u ON bt.matched_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND bt.matched_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND bt.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (from_date) {
      query += ` AND bt.transaction_date >= $${paramIndex}`;
      params.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      query += ` AND bt.transaction_date <= $${paramIndex}`;
      params.push(to_date);
      paramIndex++;
    }

    query += ` ORDER BY bt.transaction_date DESC, bt.id DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get counts by status
    const countsResult = await pool.query(
      `SELECT matched_status, COUNT(*) as count FROM bank_transactions GROUP BY matched_status`
    );

    res.json({
      transactions: result.rows,
      counts: countsResult.rows.reduce((acc, row) => {
        acc[row.matched_status] = parseInt(row.count);
        return acc;
      }, {}),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error("Get bank transactions error:", error);
    res.status(500).json({ error: "Failed to fetch bank transactions" });
  }
};

/**
 * Auto-reconcile bank credits with outstanding fee payments
 * POST /api/finance/reconcile
 */
export const reconcileTransactions = async (req, res) => {
  try {
    const { from_date, to_date, auto_match = true } = req.body;

    // Get unmatched bank credits
    const unmatchedCreditsQuery = `
      SELECT * FROM bank_transactions 
      WHERE type = 'credit' 
        AND matched_status = 'unmatched'
        ${from_date ? `AND transaction_date >= '${from_date}'` : ''}
        ${to_date ? `AND transaction_date <= '${to_date}'` : ''}
      ORDER BY amount, transaction_date
    `;
    const unmatchedCredits = await pool.query(unmatchedCreditsQuery);

    // Get outstanding fee payments (not yet matched to bank transactions)
    const outstandingPaymentsQuery = `
      SELECT fp.*, u.name as student_name, s.student_id
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN bank_transactions bt ON bt.matched_fee_id = fp.id
      WHERE bt.id IS NULL
      ORDER BY fp.amount_paid, fp.payment_date
    `;
    const outstandingPayments = await pool.query(outstandingPaymentsQuery);

    const matched = [];
    const unmatched = unmatchedCredits.rows.map(c => ({
      ...c,
      potential_matches: []
    }));

    if (auto_match) {
      for (const credit of unmatchedCredits.rows) {
        // Find potential matches by amount and name similarity
        const potentialMatches = outstandingPayments.rows.filter(payment => {
          const amountMatch = Math.abs(parseFloat(payment.amount_paid) - parseFloat(credit.amount)) < 0.01;
          const nameInDescription = credit.description.toLowerCase().includes(payment.student_name.toLowerCase());
          return amountMatch || nameInDescription;
        });

        if (potentialMatches.length === 1) {
          // Single match - auto reconcile
          const payment = potentialMatches[0];

          await pool.query(
            `UPDATE bank_transactions 
             SET matched_fee_id = $1, 
                 matched_status = 'matched',
                 matched_at = CURRENT_TIMESTAMP,
                 matched_by = $2
             WHERE id = $3`,
            [payment.id, req.user.userId, credit.id]
          );

          matched.push({
            transaction: credit,
            matched_payment: payment,
            match_type: 'auto'
          });
        } else if (potentialMatches.length > 1) {
          // Multiple potential matches - mark for review
          const unmatchedEntry = unmatched.find(u => u.id === credit.id);
          if (unmatchedEntry) {
            unmatchedEntry.potential_matches = potentialMatches;
          }
        }
      }
    }

    // Filter out matched transactions from unmatched list
    const finalUnmatched = unmatched.filter(u =>
      !matched.some(m => m.transaction.id === u.id)
    );

    res.json({
      message: `Reconciliation complete. ${matched.length} transactions matched.`,
      matched,
      unmatched: finalUnmatched,
      stats: {
        total_unmatched_credits: unmatchedCredits.rows.length,
        total_outstanding_payments: outstandingPayments.rows.length,
        auto_matched: matched.length,
        pending_review: finalUnmatched.filter(u => u.potential_matches.length > 0).length
      }
    });
  } catch (error) {
    console.error("Reconcile transactions error:", error);
    res.status(500).json({ error: "Failed to reconcile transactions" });
  }
};

/**
 * Manually match a bank transaction to a fee payment
 * POST /api/finance/bank-transactions/:id/match
 */
export const manualMatchTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { fee_payment_id } = req.body;
    const { userId } = req.user;

    if (!fee_payment_id) {
      return res.status(400).json({ error: "fee_payment_id is required" });
    }

    // Verify the transaction exists
    const txnResult = await pool.query(
      `SELECT * FROM bank_transactions WHERE id = $1`,
      [id]
    );

    if (txnResult.rows.length === 0) {
      return res.status(404).json({ error: "Bank transaction not found" });
    }

    // Verify the fee payment exists
    const paymentResult = await pool.query(
      `SELECT * FROM fee_payments WHERE id = $1`,
      [fee_payment_id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: "Fee payment not found" });
    }

    // Update the bank transaction
    const result = await pool.query(
      `UPDATE bank_transactions 
       SET matched_fee_id = $1, 
           matched_status = 'matched',
           matched_at = CURRENT_TIMESTAMP,
           matched_by = $2
       WHERE id = $3
       RETURNING *`,
      [fee_payment_id, userId, id]
    );

    res.json({
      message: "Transaction matched successfully",
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error("Manual match error:", error);
    res.status(500).json({ error: "Failed to match transaction" });
  }
};

/**
 * Mark a transaction as disputed
 * POST /api/finance/bank-transactions/:id/dispute
 */
export const disputeTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId } = req.user;

    const result = await pool.query(
      `UPDATE bank_transactions 
       SET matched_status = 'disputed',
           raw_data = raw_data || jsonb_build_object('dispute_reason', $1, 'disputed_by', $2, 'disputed_at', CURRENT_TIMESTAMP::text)
       WHERE id = $3
       RETURNING *`,
      [reason || 'No reason provided', userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      message: "Transaction marked as disputed",
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error("Dispute transaction error:", error);
    res.status(500).json({ error: "Failed to dispute transaction" });
  }
};

/**
 * Get reconciliation report
 * GET /api/finance/reconciliation-report
 */
export const getReconciliationReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    // Summary stats
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN matched_status = 'matched' THEN 1 END) as matched_count,
        COUNT(CASE WHEN matched_status = 'unmatched' THEN 1 END) as unmatched_count,
        COUNT(CASE WHEN matched_status = 'disputed' THEN 1 END) as disputed_count,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN matched_status = 'matched' AND type = 'credit' THEN amount ELSE 0 END) as matched_credits
      FROM bank_transactions
      WHERE 1=1
      ${from_date ? `AND transaction_date >= '${from_date}'` : ''}
      ${to_date ? `AND transaction_date <= '${to_date}'` : ''}
    `;
    const summary = await pool.query(summaryQuery);

    // Daily breakdown
    const dailyQuery = `
      SELECT 
        transaction_date,
        COUNT(*) as transaction_count,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as credits,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as debits,
        COUNT(CASE WHEN matched_status = 'matched' THEN 1 END) as matched
      FROM bank_transactions
      WHERE 1=1
      ${from_date ? `AND transaction_date >= '${from_date}'` : ''}
      ${to_date ? `AND transaction_date <= '${to_date}'` : ''}
      GROUP BY transaction_date
      ORDER BY transaction_date DESC
    `;
    const daily = await pool.query(dailyQuery);

    res.json({
      summary: summary.rows[0],
      daily_breakdown: daily.rows
    });
  } catch (error) {
    console.error("Reconciliation report error:", error);
    res.status(500).json({ error: "Failed to generate reconciliation report" });
  }
};
