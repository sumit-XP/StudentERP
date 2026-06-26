import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import InvoiceListScreen from '../../screens/fees/InvoiceListScreen';
import InvoiceDetailScreen from '../../screens/fees/InvoiceDetailScreen';
import OnlinePaymentScreen from '../../screens/fees/OnlinePaymentScreen';
import FeeReportsScreen from '../../screens/fees/FeeReportsScreen';

export type FeesStackParamList = {
  InvoiceList: undefined;
  InvoiceDetail: { invoiceId: string };
  OnlinePayment: { invoiceId: string };
  FeeReports: undefined;
};

const Stack = createStackNavigator<FeesStackParamList>();

const FeesNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="InvoiceList"
      component={InvoiceListScreen}
      options={{ title: 'Invoices' }}
    />
    <Stack.Screen
      name="InvoiceDetail"
      component={InvoiceDetailScreen}
      options={{ title: 'Invoice Details' }}
    />
    <Stack.Screen
      name="OnlinePayment"
      component={OnlinePaymentScreen}
      options={{ title: 'Pay Online' }}
    />
    <Stack.Screen
      name="FeeReports"
      component={FeeReportsScreen}
      options={{ title: 'Fee Reports' }}
    />
  </Stack.Navigator>
);

export default FeesNavigator;
