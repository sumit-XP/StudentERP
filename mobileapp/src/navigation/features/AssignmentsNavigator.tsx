import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AssignmentListScreen from '../../screens/assignments/AssignmentListScreen';
import AssignmentDetailScreen from '../../screens/assignments/AssignmentDetailScreen';
import SubmitAssignmentScreen from '../../screens/assignments/SubmitAssignmentScreen';
import GradeSubmissionScreen from '../../screens/assignments/GradeSubmissionScreen';

export type AssignmentsStackParamList = {
  AssignmentList: undefined;
  AssignmentDetail: { assignmentId: string };
  SubmitAssignment: { assignmentId: string };
  GradeSubmission: { submissionId: string };
};

const Stack = createStackNavigator<AssignmentsStackParamList>();

const AssignmentsNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="AssignmentList"
      component={AssignmentListScreen}
      options={{ title: 'Assignments' }}
    />
    <Stack.Screen
      name="AssignmentDetail"
      component={AssignmentDetailScreen}
      options={{ title: 'Assignment Details' }}
    />
    <Stack.Screen
      name="SubmitAssignment"
      component={SubmitAssignmentScreen}
      options={{ title: 'Submit Assignment' }}
    />
    <Stack.Screen
      name="GradeSubmission"
      component={GradeSubmissionScreen}
      options={{ title: 'Grade Submission' }}
    />
  </Stack.Navigator>
);

export default AssignmentsNavigator;
