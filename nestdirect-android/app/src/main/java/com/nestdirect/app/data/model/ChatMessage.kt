package com.nestdirect.app.data.model

/** Mirrors the web app's `ChatMessage` interface (src/types.ts) exactly. */
data class ChatMessage(
    val id: String = "",
    val propertyId: String = "",
    val sender: String = "tenant", // "tenant" | "owner"
    val text: String = "",
    val timestamp: String = "",
    val tenantEmail: String? = null,
    val ownerEmail: String? = null
)
