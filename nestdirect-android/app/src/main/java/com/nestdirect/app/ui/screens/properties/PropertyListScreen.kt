package com.nestdirect.app.ui.screens.properties

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.nestdirect.app.data.model.Property

private val Terracotta = Color(0xFFB5652B)
private val Brass = Color(0xFFC9A227)

@Composable
fun PropertyListScreen(
    viewModel: PropertyListViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onPropertyClick: (Property) -> Unit
) {
    val properties by viewModel.properties.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val searchQuery by viewModel.searchQuery.collectAsStateWithLifecycle()
    val selectedCity by viewModel.selectedCity.collectAsStateWithLifecycle()
    val favoriteIds by viewModel.favoriteIds.collectAsStateWithLifecycle()
    val showOnlyFavorites by viewModel.showOnlyFavorites.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Handpicked Properties") },
            actions = {
                IconButton(onClick = { viewModel.onToggleShowOnlyFavorites() }) {
                    Icon(
                        imageVector = if (showOnlyFavorites) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        contentDescription = "Show favorites only",
                        tint = if (showOnlyFavorites) Terracotta else LocalContentColor.current
                    )
                }
            }
        )

        OutlinedTextField(
            value = searchQuery,
            onValueChange = viewModel::onSearchQueryChange,
            placeholder = { Text("Search neighborhood or property") },
            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.padding(bottom = 8.dp)
        ) {
            items(CITIES) { city ->
                FilterChip(
                    selected = selectedCity == city,
                    onClick = { viewModel.onCitySelected(city) },
                    label = { Text(if (city == "All") "Everywhere" else city) },
                    colors = FilterChipDefaults.filterChipColors(selectedContainerColor = Terracotta.copy(alpha = 0.15f))
                )
            }
        }

        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else if (properties.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(if (showOnlyFavorites) "No favorites yet" else "No properties match your search")
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(properties, key = { it.id }) { property ->
                    PropertyCard(
                        property = property,
                        isFavorite = favoriteIds.contains(property.id),
                        onFavoriteClick = { viewModel.toggleFavorite(property.id) },
                        onClick = { onPropertyClick(property) }
                    )
                }
            }
        }
    }
}

@Composable
private fun PropertyCard(
    property: Property,
    isFavorite: Boolean,
    onFavoriteClick: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            Box {
                AsyncImage(
                    model = property.photos.firstOrNull(),
                    contentDescription = property.title,
                    modifier = Modifier.fillMaxWidth().height(180.dp)
                )
                IconButton(
                    onClick = onFavoriteClick,
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)
                ) {
                    Icon(
                        imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                        contentDescription = "Toggle favorite",
                        tint = if (isFavorite) Terracotta else Color.White
                    )
                }
            }
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "\u20B9${"%,d".format(property.price)}",
                        style = MaterialTheme.typography.titleLarge,
                        color = Terracotta
                    )
                    Spacer(Modifier.width(8.dp))
                    if (property.ownerVerified) {
                        Icon(Icons.Filled.CheckCircle, contentDescription = "Verified", tint = Brass, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Verified", style = MaterialTheme.typography.labelSmall, color = Brass)
                    }
                }
                Text(property.title, style = MaterialTheme.typography.titleMedium)
                Text("${property.city} • ${property.bedrooms} BHK • ${property.areaSqFt} sq.ft", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
