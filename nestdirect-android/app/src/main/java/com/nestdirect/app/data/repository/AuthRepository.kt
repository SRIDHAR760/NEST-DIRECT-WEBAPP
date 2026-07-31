package com.nestdirect.app.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.tasks.await

/**
 * Mirrors src/firebase.ts on the web app: same three sign-in methods,
 * same underlying Firebase project (nestdirect-prod), same user records.
 */
class AuthRepository {
    private val auth = FirebaseAuth.getInstance()

    val currentUser: FirebaseUser? get() = auth.currentUser

    suspend fun signInWithGoogleIdToken(idToken: String): Result<FirebaseUser> = try {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val result = auth.signInWithCredential(credential).await()
        result.user?.let { Result.success(it) } ?: Result.failure(Exception("No user returned"))
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun signInAsGuest(): Result<FirebaseUser> = try {
        val result = auth.signInAnonymously().await()
        result.user?.let { Result.success(it) } ?: Result.failure(Exception("No user returned"))
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun signInWithEmail(email: String, password: String): Result<FirebaseUser> = try {
        val result = auth.signInWithEmailAndPassword(email, password).await()
        result.user?.let { Result.success(it) } ?: Result.failure(Exception("No user returned"))
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun signUpWithEmail(email: String, password: String): Result<FirebaseUser> = try {
        val result = auth.createUserWithEmailAndPassword(email, password).await()
        result.user?.let { Result.success(it) } ?: Result.failure(Exception("No user returned"))
    } catch (e: Exception) {
        Result.failure(e)
    }

    fun signOut() = auth.signOut()

    /**
     * Translates raw FirebaseAuthException messages into the same
     * user-facing copy as the web app's getAuthErrorMessage() in firebase.ts,
     * so both apps give consistent guidance for the same failure.
     */
    fun getAuthErrorMessage(e: Throwable): String {
        val raw = e.message ?: e.toString()
        return when {
            raw.contains("no user record") || raw.contains("password is invalid") ->
                "Invalid email or password. Please verify your details or use Guest access."
            raw.contains("badly formatted") -> "Invalid email format. E.g. example@gmail.com"
            raw.contains("already in use") -> "This email is already in use. Please sign in instead."
            raw.contains("WEAK_PASSWORD") -> "Weak password. It must be at least 6 characters."
            raw.contains("network error") -> "Network error reaching Firebase — check your internet connection and try again."
            else -> raw
        }
    }
}
