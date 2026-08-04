package com.nestdirect.app.ui.screens.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.nestdirect.app.data.model.ChatMessage
import com.nestdirect.app.data.model.Property
import com.nestdirect.app.data.repository.ChatRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ChatViewModel(private val repo: ChatRepository = ChatRepository()) : ViewModel() {
    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages

    private val currentUserEmail: String?
        get() = FirebaseAuth.getInstance().currentUser?.email

    init {
        val email = currentUserEmail ?: return
        viewModelScope.launch {
            repo.observeMyMessages(email).collect { _messages.value = it }
        }
    }

    fun messagesForProperty(propertyId: String): List<ChatMessage> =
        _messages.value.filter { it.propertyId == propertyId }

    fun sendMessage(property: Property, text: String) {
        val myEmail = currentUserEmail ?: return
        val isOwner = property.ownerName.contains("(You)") || property.ownerEmail == myEmail
        viewModelScope.launch {
            repo.sendMessage(
                propertyId = property.id,
                text = text,
                sender = if (isOwner) "owner" else "tenant",
                tenantEmail = if (isOwner) (messagesForProperty(property.id).firstOrNull { it.tenantEmail != null }?.tenantEmail ?: "unknown@nestdirect.com") else myEmail,
                ownerEmail = property.ownerEmail.ifBlank { "unknown@nestdirect.com" }
            )
        }
    }
}
