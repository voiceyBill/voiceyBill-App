import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChangePasswordScreen from "../screens/settings/ChangePasswordScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import AccountScreen from "../screens/settings/AccountScreen";
import AppearanceScreen from "../screens/settings/AppearanceScreen";
import BillingScreen from "../screens/settings/BillingScreen";

const Stack = createNativeStackNavigator();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: "Settings", headerShown: false }}
      />
      <Stack.Screen
        name="Account"
        component={AccountScreen}
        options={{ title: "Account Settings", headerShown: false }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Change Password", headerShown: false }}
      />
      <Stack.Screen
        name="Appearance"
        component={AppearanceScreen}
        options={{ title: "Appearance", headerShown: false }}
      />
      <Stack.Screen
        name="Billing"
        component={BillingScreen}
        options={{ title: "Billing", headerShown: false }}
      />
    </Stack.Navigator>
  );
}
