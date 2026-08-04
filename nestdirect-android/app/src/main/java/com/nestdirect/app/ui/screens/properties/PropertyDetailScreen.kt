package com.nestdirect.app.ui.screens.properties

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.nestdirect.app.data.model.Property
import com.nestdirect.app.data.repository.PropertyRepository
import kotlinx.coroutines.launch

@Composable
fun PropertyDetailScreen(propertyId: String, onBack: () -> Unit, onMessageOwner: () -> Unit = {}) {
    var property by remember { mutableStateOf<Property?>(null) }
    val repo = remember { PropertyRepository() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(propertyId) {
        scope.launch { property = repo.getProperty(propertyId) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(property?.title ?: "Loading...") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Text("←") }
                }
            )
        }
    ) { padding ->
        val prop = property
        if (prop == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = androidx.compose.ui.Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AsyncImage(
                    model = prop.photos.firstOrNull(),
                    contentDescription = prop.title,
                    modifier = Modifier.fillMaxWidth().height(240.dp)
                )
                Text("\u20B9${"%,d".format(prop.price)}/mo", style = MaterialTheme.typography.headlineSmall)
                Text(prop.title, style = MaterialTheme.typography.titleLarge)
                Text("${prop.address}, ${prop.city}", style = MaterialTheme.typography.bodyMedium)

                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text("${prop.bedrooms} Beds")
                    Text("${prop.bathrooms} Baths")
                    Text("${prop.areaSqFt} Sq.Ft")
                }

                Divider()
                Text("About this property", style = MaterialTheme.typography.titleMedium)
                Text(prop.description)

                Divider()
                Text("Owner", style = MaterialTheme.typography.titleMedium)
                Text(prop.ownerName)
                Text(prop.ownerPhone)

                Button(onClick = { /* TODO: wire up inquiry flow to the shared 'inquiries' collection */ }, modifier = Modifier.fillMaxWidth()) {
                    Text("Request Handover Visit")
                }
            }
        }
    }
}
