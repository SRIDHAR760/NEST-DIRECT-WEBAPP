package com.nestdirect.app.data.model

/**
 * Mirrors the web app's `Property` interface (src/types.ts) exactly.
 * Both the web app and this native app read/write the same Firestore
 * `properties` collection, so field names and types must stay in sync.
 */
data class Property(
    val id: String = "",
    val title: String = "",
    val description: String = "",
    val price: Long = 0,
    val securityDeposit: Long = 0,
    val type: String = "",
    val address: String = "",
    val city: String = "",
    val bedrooms: Int = 0,
    val bathrooms: Double = 0.0,
    val areaSqFt: Int = 0,
    val amenities: List<String> = emptyList(),
    val photos: List<String> = emptyList(),
    val ownerName: String = "",
    val ownerPhone: String = "",
    val ownerEmail: String = "",
    val ownerAvatar: String = "",
    val ownerVerified: Boolean = false,
    val createdAt: String = "",
    val brokerSavings: Long = 0,
    val isFeatured: Boolean = false,
    val status: String = "available"
)
