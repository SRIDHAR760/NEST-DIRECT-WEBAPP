package com.nestdirect.app.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.firebase.auth.FirebaseAuth
import com.nestdirect.app.data.model.Property
import com.nestdirect.app.ui.screens.auth.LoginScreen
import com.nestdirect.app.ui.screens.chat.ChatListScreen
import com.nestdirect.app.ui.screens.chat.ChatThreadScreen
import com.nestdirect.app.ui.screens.properties.PropertyDetailScreen
import com.nestdirect.app.ui.screens.properties.PropertyListScreen
import com.nestdirect.app.ui.screens.properties.PropertyListViewModel

object Routes {
    const val LOGIN = "login"
    const val PROPERTY_LIST = "property_list"
    const val PROPERTY_DETAIL = "property_detail/{propertyId}"
    const val CHAT_LIST = "chat_list"
    const val CHAT_THREAD = "chat_thread/{propertyId}"
    fun propertyDetail(id: String) = "property_detail/$id"
    fun chatThread(id: String) = "chat_thread/$id"
}

@Composable
fun NestDirectNavGraph(navController: NavHostController = rememberNavController()) {
    val startDestination = if (FirebaseAuth.getInstance().currentUser != null) Routes.PROPERTY_LIST else Routes.LOGIN
    // Shared across screens so Chat can look up property details (title, owner email) by ID
    val propertyListViewModel: PropertyListViewModel = androidx.lifecycle.viewmodel.compose.viewModel()

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Routes.LOGIN) {
            LoginScreen(onAuthenticated = {
                navController.navigate(Routes.PROPERTY_LIST) {
                    popUpTo(Routes.LOGIN) { inclusive = true }
                }
            })
        }
        composable(Routes.PROPERTY_LIST) {
            PropertyListScreen(viewModel = propertyListViewModel, onPropertyClick = { property ->
                navController.navigate(Routes.propertyDetail(property.id))
            })
        }
        composable(Routes.PROPERTY_DETAIL) { backStackEntry ->
            val propertyId = backStackEntry.arguments?.getString("propertyId") ?: return@composable
            PropertyDetailScreen(
                propertyId = propertyId,
                onBack = { navController.popBackStack() },
                onMessageOwner = { navController.navigate(Routes.chatThread(propertyId)) }
            )
        }
        composable(Routes.CHAT_LIST) {
            val properties by propertyListViewModel.properties.collectAsStateWithLifecycle()
            ChatListScreen(properties = properties, onOpenConversation = { property ->
                navController.navigate(Routes.chatThread(property.id))
            })
        }
        composable(Routes.CHAT_THREAD) { backStackEntry ->
            val propertyId = backStackEntry.arguments?.getString("propertyId") ?: return@composable
            val properties by propertyListViewModel.properties.collectAsStateWithLifecycle()
            val property: Property? = properties.find { it.id == propertyId }
            if (property != null) {
                ChatThreadScreen(property = property, onBack = { navController.popBackStack() })
            }
        }
    }
}
