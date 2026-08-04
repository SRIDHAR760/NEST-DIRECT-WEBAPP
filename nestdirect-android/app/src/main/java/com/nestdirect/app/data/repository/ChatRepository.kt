package com.nestdirect.app.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.nestdirect.app.data.model.ChatMessage
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import java.text.SimpleDateFormat
import java.util.*

/**
 * Reads/writes the same `chat_messages` collection as the web app.
 * Queries MUST be scoped by tenantEmail/ownerEmail to satisfy the
 * Firestore rules (see firestore.rules — list requires a matching
 * where() filter, not an open collection scan).
 */
class ChatRepository {
    private val db = FirebaseFirestore.getInstance()

    /** All messages where the current user is either the tenant or the property owner. */
    fun observeMyMessages(userEmail: String): Flow<List<ChatMessage>> = callbackFlow {
        val combined = mutableMapOf<String, ChatMessage>()

        fun emit() = trySend(combined.values.sortedBy { it.timestamp })

        val tenantListener = db.collection("chat_messages")
            .whereEqualTo("tenantEmail", userEmail)
            .addSnapshotListener { snapshot, error ->
                if (error != null) { close(error); return@addSnapshotListener }
                snapshot?.documents?.forEach { doc ->
                    doc.toObject(ChatMessage::class.java)?.let { combined[doc.id] = it.copy(id = doc.id) }
                }
                emit()
            }

        val ownerListener = db.collection("chat_messages")
            .whereEqualTo("ownerEmail", userEmail)
            .addSnapshotListener { snapshot, error ->
                if (error != null) { close(error); return@addSnapshotListener }
                snapshot?.documents?.forEach { doc ->
                    doc.toObject(ChatMessage::class.java)?.let { combined[doc.id] = it.copy(id = doc.id) }
                }
                emit()
            }

        awaitClose {
            tenantListener.remove()
            ownerListener.remove()
        }
    }

    suspend fun sendMessage(
        propertyId: String,
        text: String,
        sender: String,
        tenantEmail: String,
        ownerEmail: String
    ) {
        val id = "msg-${System.currentTimeMillis()}"
        val timestamp = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
        val message = ChatMessage(
            id = id,
            propertyId = propertyId,
            sender = sender,
            text = text,
            timestamp = timestamp,
            tenantEmail = tenantEmail,
            ownerEmail = ownerEmail
        )
        db.collection("chat_messages").document(id).set(message)
    }
}
