package com.nestdirect.app.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.firebase.auth.FirebaseUser

private val Terracotta = androidx.compose.ui.graphics.Color(0xFFB5652B)
private val Parchment = androidx.compose.ui.graphics.Color(0xFFF6F3EC)

enum class AuthTab { QUICK_ACCESS, SIGN_IN, REGISTER }

@Composable
fun LoginScreen(
    viewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onAuthenticated: (FirebaseUser) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var tab by remember { mutableStateOf(AuthTab.QUICK_ACCESS) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(uiState) {
        if (uiState is AuthUiState.Success) {
            onAuthenticated((uiState as AuthUiState.Success).user)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Parchment)
            .padding(24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text("NestDirect", style = MaterialTheme.typography.headlineMedium)
        Text("Direct renting without fees", style = MaterialTheme.typography.titleMedium, color = Terracotta)
        Spacer(Modifier.height(24.dp))

        TabRow(selectedTabIndex = tab.ordinal) {
            Tab(selected = tab == AuthTab.QUICK_ACCESS, onClick = { tab = AuthTab.QUICK_ACCESS }, text = { Text("QUICK ACCESS") })
            Tab(selected = tab == AuthTab.SIGN_IN, onClick = { tab = AuthTab.SIGN_IN }, text = { Text("SIGN IN") })
            Tab(selected = tab == AuthTab.REGISTER, onClick = { tab = AuthTab.REGISTER }, text = { Text("REGISTER") })
        }

        Spacer(Modifier.height(24.dp))

        when (tab) {
            AuthTab.QUICK_ACCESS -> {
                Button(
                    onClick = { viewModel.signInAsGuest() },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Terracotta)
                ) {
                    Text("Instant Guest Access (One-Click)")
                }
                // Google Sign-In requires a configured Web Client ID from google-services.json
                // and the One Tap / Credential Manager flow — wired up once that config is added.
            }
            AuthTab.SIGN_IN -> {
                EmailPasswordForm(email, { email = it }, password, { password = it })
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { viewModel.signInWithEmail(email, password) },
                    modifier = Modifier.fillMaxWidth().height(56.dp)
                ) { Text("Sign In with Email") }
            }
            AuthTab.REGISTER -> {
                EmailPasswordForm(email, { email = it }, password, { password = it })
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = { viewModel.signUpWithEmail(email, password) },
                    modifier = Modifier.fillMaxWidth().height(56.dp)
                ) { Text("Create Account") }
            }
        }

        Spacer(Modifier.height(16.dp))
        when (val state = uiState) {
            is AuthUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterHorizontally))
            is AuthUiState.Error -> Text(state.message, color = MaterialTheme.colorScheme.error)
            else -> {}
        }
    }
}

@Composable
private fun EmailPasswordForm(
    email: String, onEmailChange: (String) -> Unit,
    password: String, onPasswordChange: (String) -> Unit
) {
    OutlinedTextField(
        value = email,
        onValueChange = onEmailChange,
        label = { Text("Email") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        modifier = Modifier.fillMaxWidth()
    )
    Spacer(Modifier.height(12.dp))
    OutlinedTextField(
        value = password,
        onValueChange = onPasswordChange,
        label = { Text("Password") },
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        modifier = Modifier.fillMaxWidth()
    )
}
