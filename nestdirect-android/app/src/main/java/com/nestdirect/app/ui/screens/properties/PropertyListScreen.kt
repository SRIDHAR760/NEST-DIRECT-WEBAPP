package com.nestdirect.app.ui.screens.properties

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
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

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Handpicked Properties") })

        if (isLoading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(properties, key = { it.id }) { property ->
                    PropertyCard(property = property, onClick = { onPropertyClick(property) })
                }
            }
        }
    }
}

@Composable
private fun PropertyCard(property: Property, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            AsyncImage(
                model = property.photos.firstOrNull(),
                contentDescription = property.title,
                modifier = Modifier.fillMaxWidth().height(180.dp)
            )
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
