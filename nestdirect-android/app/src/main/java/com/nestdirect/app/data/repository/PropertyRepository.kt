package com.nestdirect.app.data.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.nestdirect.app.data.model.Property
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/**
 * Reads the exact same `properties` Firestore collection the web app uses —
 * one shared backend, two independent frontends (matching the Instagram/
 * WhatsApp Web pattern: same account and data, separate native codebases).
 */
class PropertyRepository {
    private val db = FirebaseFirestore.getInstance()

    /** Live stream of all properties, updating in real time like the web app's onSnapshot. */
    fun observeProperties(): Flow<List<Property>> = callbackFlow {
        val listener = db.collection("properties")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val properties = snapshot?.documents?.mapNotNull { doc ->
                    doc.toObject(Property::class.java)?.copy(id = doc.id)
                } ?: emptyList()
                trySend(properties)
            }
        awaitClose { listener.remove() }
    }

    suspend fun getProperty(propertyId: String): Property? {
        val doc = db.collection("properties").document(propertyId).get().await()
        return doc.toObject(Property::class.java)?.copy(id = doc.id)
    }
}
