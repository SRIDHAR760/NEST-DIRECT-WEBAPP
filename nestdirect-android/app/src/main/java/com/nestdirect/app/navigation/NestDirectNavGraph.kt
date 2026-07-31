package com.nestdirect.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.firebase.auth.FirebaseAuth
import com.nestdirect.app.ui.screens.auth.LoginScreen
import com.nestdirect.app.ui.screens.properties.PropertyDetailScreen
import com.nestdirect.app.ui.screens.properties.PropertyListScreen

object Routes {
    const val LOGIN = "login"
    const val PROPERTY_LIST = "property_list"
    const val PROPERTY_DETAIL = "property_detail/{propertyId}"
    fun propertyDetail(id: String) = "property_detail/$id"
}

@Composable
fun NestDirectNavGraph(navController: NavHostController = rememberNavController()) {
    val startDestination = if (FirebaseAuth.getInstance().currentUser != null) Routes.PROPERTY_LIST else Routes.LOGIN

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Routes.LOGIN) {
            LoginScreen(onAuthenticated = {
                navController.navigate(Routes.PROPERTY_LIST) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }
        composable(Routes.PROPERTY_LIST) {
            PropertyListScreen(onPropertyClick = { property ->
                navController.navigate(Routes.propertyDetail(property.id))
            })
        }
        composable(Routes.PROPERTY_DETAIL) { backStackEntry ->
            val propertyId = backStackEntry.arguments?.getString("propertyId") ?: return@composable
            PropertyDetailScreen(propertyId = propertyId, onBack = { navController.popBackStack() })
        }
    }
}
