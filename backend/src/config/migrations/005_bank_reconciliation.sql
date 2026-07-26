-- Bank Reconciliation Migration
-- Creates bank_transactions table for Task 7

CREATE TABLE IF NOT EXISTS bank_transactions (
    id SERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    reference_number VARCHAR(100),
    bank_account VARCHAR(50),
    
    -- Matching fields
    matched_fee_id INTEGER REFERENCES fee_payments(id) ON DELETE SET NULL,
    matched_status VARCHAR(20) DEFAULT 'unmatched', -- unmatched, matched, disputed
    matched_at TIMESTAMP,
    matched_by INTEGER REFERENCES users(id),
    
    -- Raw import data (for audit)
    raw_data JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_status ON bank_transactions(matched_status);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(type);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched_fee ON bank_transactions(matched_fee_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_amount ON bank_transactions(amount);

-- Trigger for updated_at
CREATE TRIGGER update_bank_transactions_updated_at BEFORE UPDATE ON bank_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
