package com.nestdirect.app.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.google.firebase.auth.FirebaseAuth
import com.nestdirect.app.data.model.Property

private val Terracotta = Color(0xFFB5652B)

@Composable
fun ChatThreadScreen(
    property: Property,
    viewModel: ChatViewModel = androidx.lifecycle.viewmodel.compose.viewModel(),
    onBack: () -> Unit
) {
    val allMessages by viewModel.messages.collectAsStateWithLifecycle()
    val messages = allMessages.filter { it.propertyId == property.id }
    var inputText by remember { mutableStateOf("") }
    val myEmail = FirebaseAuth.getInstance().currentUser?.email

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(property.title) },
                navigationIcon = { IconButton(onClick = onBack) { Text("←") } }
            )
        },
        bottomBar = {
            Row(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    placeholder = { Text("Type a message") },
                    modifier = Modifier.weight(1f),
                    singleLine = true
                )
                IconButton(onClick = {
                    if (inputText.isNotBlank()) {
                        viewModel.sendMessage(property, inputText.trim())
                        inputText = ""
                    }
                }) {
                    Icon(Icons.Filled.Send, contentDescription = "Send", tint = Terracotta)
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            reverseLayout = false
        ) {
            items(messages, key = { it.id }) { msg ->
                val isMine = (msg.sender == "owner" && property.ownerEmail == myEmail) ||
                    (msg.sender == "tenant" && msg.tenantEmail == myEmail)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
                ) {
                    Column(
                        modifier = Modifier
                            .background(
                                if (isMine) Terracotta else Color(0xFFF0EDE6),
                                RoundedCornerShape(12.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                            .widthIn(max = 260.dp)
                    ) {
                        Text(msg.text, color = if (isMine) Color.White else Color.Black)
                        Text(
                            msg.timestamp,
                            style = MaterialTheme.typography.labelSmall,
                            color = if (isMine) Color.White.copy(alpha = 0.7f) else Color.Gray
                        )
                    }
                }
            }
        }
    }
}
