package com.nestdirect.app.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.nestdirect.app.data.model.Property

@Composable
fun ChatListScreen(
    properties: List<Property>,
    viewModel: ChatViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onOpenConversation: (Property) -> Unit
) {
    val messages by viewModel.messages.collectAsStateWithLifecycle()
    val propertyIdsWithChats = messages.map { it.propertyId }.toSet()
    val conversations = properties.filter { it.id in propertyIdsWithChats }

    Column(Modifier.fillMaxSize()) {
        TopAppBar(title = { Text("Messages") })

        if (conversations.isEmpty()) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No conversations yet — message an owner from a property page")
            }
        } else {
            LazyColumn {
                items(conversations, key = { it.id }) { property ->
                    val lastMessage = messages.filter { it.propertyId == property.id }.maxByOrNull { it.timestamp }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onOpenConversation(property) }
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .background(Color(0xFFB5652B).copy(alpha = 0.15f), shape = androidx.compose.foundation.shape.CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(property.title.take(1))
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(property.title, style = MaterialTheme.typography.titleMedium)
                            Text(
                                lastMessage?.text ?: "",
                                style = MaterialTheme.typography.bodySmall,
                                maxLines = 1
                            )
                        }
                        Text(lastMessage?.timestamp ?: "", style = MaterialTheme.typography.labelSmall)
                    }
                    Divider()
                }
            }
        }
    }
}
