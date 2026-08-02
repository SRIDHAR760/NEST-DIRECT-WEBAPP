package com.nestdirect.app.ui.screens.properties

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nestdirect.app.data.model.Property
import com.nestdirect.app.data.repository.PropertyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

// Mirrors the exact locality list used in the web app (src/App.tsx line ~1261)
val CITIES = listOf("All", "Adyar", "Nungambakkam", "OMR", "Mylapore")

class PropertyListViewModel(private val repo: PropertyRepository = PropertyRepository()) : ViewModel() {
    private val _allProperties = MutableStateFlow<List<Property>>(emptyList())
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    private val _selectedCity = MutableStateFlow("All")
    val selectedCity: StateFlow<String> = _selectedCity

    private val _favoriteIds = MutableStateFlow<Set<String>>(emptySet())
    val favoriteIds: StateFlow<Set<String>> = _favoriteIds

    private val _showOnlyFavorites = MutableStateFlow(false)
    val showOnlyFavorites: StateFlow<Boolean> = _showOnlyFavorites

    val properties: StateFlow<List<Property>> = combine(
        _allProperties, _searchQuery, _selectedCity, _favoriteIds, _showOnlyFavorites
    ) { all, query, city, favorites, onlyFavorites ->
        all.filter { p ->
            val matchesQuery = query.isBlank() ||
                p.title.contains(query, ignoreCase = true) ||
                p.city.contains(query, ignoreCase = true) ||
                p.address.contains(query, ignoreCase = true)
            val matchesCity = city == "All" || p.city.equals(city, ignoreCase = true)
            val matchesFavorite = !onlyFavorites || favorites.contains(p.id)
            matchesQuery && matchesCity && matchesFavorite
        }
    }.stateIn(viewModelScope, kotlinx.coroutines.flow.SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            repo.observeProperties().collect {
                _allProperties.value = it
                _isLoading.value = false
            }
        }
    }

    fun onSearchQueryChange(query: String) { _searchQuery.value = query }
    fun onCitySelected(city: String) { _selectedCity.value = city }
    fun onToggleShowOnlyFavorites() { _showOnlyFavorites.value = !_showOnlyFavorites.value }

    fun toggleFavorite(propertyId: String) {
        _favoriteIds.value = if (_favoriteIds.value.contains(propertyId)) {
            _favoriteIds.value - propertyId
        } else {
            _favoriteIds.value + propertyId
        }
        // TODO: persist to the user's Firestore document (users/{uid}.favorites),
        // matching the web app's syncFavoritesToCloud in firebase.ts, once auth
        // state is threaded into this ViewModel.
    }
}
