package com.nestdirect.app.ui.screens.properties

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nestdirect.app.data.model.Property
import com.nestdirect.app.data.repository.PropertyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class PropertyListViewModel(private val repo: PropertyRepository = PropertyRepository()) : ViewModel() {
    private val _properties = MutableStateFlow<List<Property>>(emptyList())
    val properties: StateFlow<List<Property>> = _properties

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        viewModelScope.launch {
            repo.observeProperties().collect {
                _properties.value = it
                _isLoading.value = false
            }
        }
    }
}
