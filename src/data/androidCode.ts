import { KotlinFile } from "../types";

export const ANDROID_FILES: KotlinFile[] = [
  {
    path: "app/build.gradle.kts",
    name: "build.gradle.kts",
    language: "kotlin",
    description: "App-level build configurations detailing Kotlin, Jetpack Compose, Room database, Retrofit network clients, and ExoPlayer dependencies.",
    code: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")
}

android {
    namespace = "com.tv.indiaiptv"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.tv.indiaiptv"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Core Android Jetpack
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Compose UI
    implementation(platform("androidx.compose:compose-bom:22023.10.01"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Retrofit (Network)
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Room (Local Cache + Favorites & History Persistence)
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // ExoPlayer (Video/Audio Streaming Support for m3u8, ts, mpd)
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.2.1") // Critical for HLS (.m3u8) streams

    // Coil (Image Loading & Caching)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/domain/models/IPTVChannel.kt",
    name: "IPTVChannel.kt",
    language: "kotlin",
    description: "Domain specifications detail the core Kotlin data representation representing unified items.",
    code: `package com.tv.indiaiptv.domain.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

@Parcelize
data class IPTVChannel(
    val id: String,
    val name: String,
    val logo: String?,
    val category: String,
    val streamUrl: String,
    val quality: String?
) : Parcelable
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/data/api/IPTVApiService.kt",
    name: "IPTVApiService.kt",
    language: "kotlin",
    description: "Retrofit network models and endpoints linking IPTV-org's public streaming repos.",
    code: `package com.tv.indiaiptv.data.api

import retrofit2.http.GET

interface IPTVApiService {
    @GET("channels.json")
    async fun getChannels(): List<ApiChannel>

    @GET("streams.json")
    async fun getStreams(): List<ApiStream>

    @GET("logos.json")
    async fun getLogos(): List<ApiLogo>
}

data class ApiChannel(
    val id: String,
    val name: String,
    val country: String?,
    val categories: List<String>?
)

data class ApiStream(
    val channel: String,
    val url: String,
    val quality: String?
)

data class ApiLogo(
    val channel: String,
    val logo: String
)
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/data/database/IPTVDatabase.kt",
    name: "IPTVDatabase.kt",
    language: "kotlin",
    description: "Defines the Room Local Storage containing table entities for Offline Channels Cache, Favorite bookmarks, and Recent history records.",
    code: `package com.tv.indiaiptv.data.database

import android.content.Context
import androidx.room.*

@Entity(tableName = "cached_channels")
data class CachedChannelEntity(
    @PrimaryKey val id: String,
    val name: String,
    val logo: String?,
    val category: String,
    val streamUrl: String,
    val quality: String?,
    val lastCachedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "favorite_channels")
data class FavoriteEntity(
    @PrimaryKey val id: String,
    val favoritedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "history_channels")
data class HistoryEntity(
    @PrimaryKey val id: String,
    val playedAt: Long = System.currentTimeMillis(),
    val watchCount: Int = 1
)

@Dao
interface IPTVDao {
    @Query("SELECT * FROM cached_channels")
    fun getCachedChannels(): List<CachedChannelEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertChannels(channels: List<CachedChannelEntity>)

    @Query("DELETE FROM cached_channels")
    fun clearCache()

    // Favorites operations
    @Query("SELECT * FROM favorite_channels")
    fun getFavorites(): List<FavoriteEntity>

    @Query("SELECT EXISTS(SELECT 1 FROM favorite_channels WHERE id = :id)")
    fun isFavorite(id: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun addFavorite(favorite: FavoriteEntity)

    @Query("DELETE FROM favorite_channels WHERE id = :id")
    fun removeFavorite(id: String)

    // Playback history operations
    @Query("SELECT * FROM history_channels ORDER BY playedAt DESC LIMIT 20")
    fun getHistory(): List<HistoryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun recordHistory(item: HistoryEntity)
    
    @Query("UPDATE history_channels SET playedAt = :time, watchCount = watchCount + 1 WHERE id = :id")
    fun updateHistoryTime(id: String, time: Long)

    @Query("SELECT EXISTS(SELECT 1 FROM history_channels WHERE id = :id)")
    fun hasHistory(id: String): Boolean
}

@Database(
    entities = [CachedChannelEntity::class, FavoriteEntity::class, HistoryEntity::class],
    version = 1,
    exportSchema = false
)
abstract class IPTVDatabase : RoomDatabase() {
    abstract fun iptvDao(): IPTVDao

    companion object {
        @Volatile
        private var INSTANCE: IPTVDatabase? = null

        fun getDatabase(context: Context): IPTVDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    IPTVDatabase::class.java,
                    "india_iptv_db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/data/repository/IPTVRepository.kt",
    name: "IPTVRepository.kt",
    language: "kotlin",
    description: "Repository handles syncing data streams from network when cache expires (>24 hours) or serves database cache immediately.",
    code: `package com.tv.indiaiptv.data.repository

import android.util.Log
import com.tv.indiaiptv.data.api.IPTVApiService
import com.tv.indiaiptv.data.database.*
import com.tv.indiaiptv.domain.models.IPTVChannel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class IPTVRepository(
    private val apiService: IPTVApiService,
    private val database: IPTVDatabase
) {
    private val dao = database.iptvDao()
    private val cacheDurationMs = 24 * 60 * 60 * 1000 // 24 hours

    suspend fun getIndianChannels(forceRefresh: Boolean = false): List<IPTVChannel> = withContext(Dispatchers.IO) {
        val cached = dao.getCachedChannels()
        val isCacheValid = cached.isNotEmpty() && 
                (System.currentTimeMillis() - cached.first().lastCachedAt < cacheDurationMs)

        if (isCacheValid && !forceRefresh) {
            Log.d("IPTVRepository", "Serving channels from Room database cache")
            return@withContext cached.map { 
                IPTVChannel(it.id, it.name, it.logo, it.category, it.streamUrl, it.quality) 
            }
        }

        Log.d("IPTVRepository", "Cache expired or forceRefresh active. Querying live API...")
        try {
            val apiChannels = apiService.getChannels()
            val apiStreams = apiService.getStreams()
            val apiLogos = apiService.getLogos()

            // 1. Filter Indian channels
            val indians = apiChannels.filter { it.country == "IN" }
            val indiansMap = indians.associateBy { it.id }

            // 2. Filter stream endpoints for active Indian channels
            val streamsMap = apiStreams
                .filter { indiansMap.containsKey(it.channel) }
                .associateBy { it.channel }

            // 3. Keep logos for active channels
            val logosMap = apiLogos
                .filter { indiansMap.containsKey(it.channel) }
                .associateBy { it.channel }

            // 4. Fuse models
            val aggregated = indians.mapNotNull { ch ->
                val streamUrl = streamsMap[ch.id]?.url ?: return@mapNotNull null // Filter only streamable
                val logoUrl = logosMap[ch.id]?.logo ?: "https://iptv-org.github.io/images/logos/\${ch.id}.png"
                val category = normalizeCategory(ch.categories)

                IPTVChannel(
                    id = ch.id,
                    name = ch.name,
                    logo = logoUrl,
                    category = category,
                    streamUrl = streamUrl,
                    quality = streamsMap[ch.id]?.quality
                )
            }

            // 5. Update local database cache
            dao.clearCache()
            dao.insertChannels(aggregated.map {
                CachedChannelEntity(
                    id = it.id,
                    name = it.name,
                    logo = it.logo,
                    category = it.category,
                    streamUrl = it.streamUrl,
                    quality = it.quality
                )
            })

            return@withContext aggregated
        } catch (e: Exception) {
            Log.e("IPTVRepository", "Error syncing remote IPTV data", e)
            // Error occurred! Fallback to cached items, even if stale
            if (cached.isNotEmpty()) {
                return@withContext cached.map { 
                    IPTVChannel(it.id, it.name, it.logo, it.category, it.streamUrl, it.quality) 
                }
            }
            throw e
        }
    }

    private fun normalizeCategory(categories: List<String>?): String {
        if (categories.isNullOrEmpty()) return "General"
        val first = categories.first().lowercase()
        return when {
            first.contains("news") -> "News"
            first.contains("sport") -> "Sports"
            first.contains("movi") || first.contains("film") || first.contains("cinema") -> "Movies"
            first.contains("kid") || first.contains("cartoon") -> "Kids"
            first.contains("music") -> "Music"
            first.contains("relig") || first.contains("spirit") -> "Religious"
            first.contains("educat") || first.contains("learn") -> "Education"
            first.contains("life") || first.contains("travel") -> "Lifestyle"
            first.contains("entert") -> "Entertainment"
            else -> "General"
        }
    }

    // Room operations
    suspend fun getFavoriteIds(): List<String> = withContext(Dispatchers.IO) {
        dao.getFavorites().map { it.id }
    }

    suspend fun toggleFavorite(channelId: String) = withContext(Dispatchers.IO) {
        if (dao.isFavorite(channelId)) {
            dao.removeFavorite(channelId)
        } else {
            dao.addFavorite(FavoriteEntity(channelId))
        }
    }

    suspend fun getWatchHistory(): List<HistoryEntity> = withContext(Dispatchers.IO) {
        dao.getHistory()
    }

    suspend fun recordPlayed(channelId: String) = withContext(Dispatchers.IO) {
        if (dao.hasHistory(channelId)) {
            dao.updateHistoryTime(channelId, System.currentTimeMillis())
        } else {
            dao.recordHistory(HistoryEntity(channelId))
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/presentation/viewmodels/IPTVViewModel.kt",
    name: "IPTVViewModel.kt",
    language: "kotlin",
    description: "The core view-state engine exposing LiveData flows for channels list, active playing channels, historical logs, search, and user configurations.",
    code: `package com.tv.indiaiptv.presentation.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tv.indiaiptv.data.repository.IPTVRepository
import com.tv.indiaiptv.domain.models.IPTVChannel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

sealed interface IPTVUiState {
    object Loading : IPTVUiState
    data class Success(
        val channels: List<IPTVChannel>,
        val categories: List<String>,
        val favorites: Set<String>,
        val watchCounts: Map<String, Int>
    ) : IPTVUiState
    data class Error(val message: String) : IPTVUiState
}

class IPTVViewModel(private val repository: IPTVRepository) : ViewModel() {

    private val _uiState = MutableStateFlow<IPTVUiState>(IPTVUiState.Loading)
    val uiState: StateFlow<IPTVUiState> = _uiState.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _recentSearches = MutableStateFlow<List<String>>(emptyList())
    val recentSearches = _recentSearches.asStateFlow()

    private var allChannels: List<IPTVChannel> = emptyList()
    private val favoriteIdsFlow = MutableStateFlow<Set<String>>(emptySet())
    private val historyFlow = MutableStateFlow<Map<String, Int>>(emptyMap())

    init {
        loadData()
    }

    fun loadData(forceRefresh: Boolean = false) {
        viewModelScope.launch {
            _uiState.value = IPTVUiState.Loading
            try {
                // Fetch channels
                allChannels = repository.getIndianChannels(forceRefresh)
                
                // Fetch favorites
                val favorites = repository.getFavoriteIds().toSet()
                favoriteIdsFlow.value = favorites

                // Fetch history
                val history = repository.getWatchHistory()
                historyFlow.value = history.associate { it.id to it.watchCount }

                updateSuccessState()
            } catch (e: Exception) {
                _uiState.value = IPTVUiState.Error(e.localizedMessage ?: "Failed to sync IPTV feeds")
            }
        }
    }

    private fun updateSuccessState() {
        val categories = allChannels.map { it.category }.distinct().sorted()
        _uiState.value = IPTVUiState.Success(
            channels = allChannels,
            categories = categories,
            favorites = favoriteIdsFlow.value,
            watchCounts = historyFlow.value
        )
    }

    fun toggleFavorite(channelId: String) {
        viewModelScope.launch {
            repository.toggleFavorite(channelId)
            val updated = favoriteIdsFlow.value.toMutableSet()
            if (updated.contains(channelId)) updated.remove(channelId) else updated.add(channelId)
            favoriteIdsFlow.value = updated
            updateSuccessState()
        }
    }

    fun recordChannelWatched(channelId: String) {
        viewModelScope.launch {
            repository.recordPlayed(channelId)
            val updatedHistory = repository.getWatchHistory().associate { it.id to it.watchCount }
            historyFlow.value = updatedHistory
            updateSuccessState()
        }
    }

    fun searchChannels(query: String) {
        _searchQuery.value = query
    }

    fun addRecentSearch(query: String) {
        if (query.isBlank()) return
        val current = _recentSearches.value.toMutableList()
        current.remove(query)
        current.add(0, query)
        if (current.size > 8) current.removeAt(current.size - 1)
        _recentSearches.value = current
    }

    fun clearRecentSearches() {
        _recentSearches.value = emptyList()
    }
}
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/presentation/screens/PlayerScreen.kt",
    name: "PlayerScreen.kt",
    language: "kotlin",
    description: "ExoPlayer engine setup inside Compose, creating fully customizable controls for streaming quality, auto reconnect on crash, and touch swipe gestures, for .m3u8 parsing.",
    code: `package com.tv.indiaiptv.presentation.screens

import android.net.Uri
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.OptIn
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.ui.PlayerView
import com.tv.indiaiptv.domain.models.IPTVChannel
import kotlinx.coroutines.delay

@OptIn(androidx.media3.common.util.UnstableApi::class)
@Composable
fun PlayerScreen(
    channel: IPTVChannel,
    isFavorite: Boolean,
    onToggleFavorite: () -> Unit,
    onBack: () -> Unit,
    onShare: () -> Unit
) {
    val context = LocalContext.current
    var isPlaying by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var currentVolume by remember { mutableFloatStateOf(1f) } // 0f to 1f
    var showGestureHint by remember { mutableStateOf(true) }

    // Initialize ExoPlayer
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
            repeatMode = Player.REPEAT_MODE_OFF
        }
    }

    // Set up HLS Media Source with connection auto-retries and specific mimetype handling
    LaunchedEffect(channel.streamUrl) {
        isLoading = true
        errorMessage = null
        try {
            val dataSourceFactory = DefaultHttpDataSource.Factory()
                .setUserAgent("Mozilla/5.0 (Linux; Android 10) ExoPlayer")
                .setAllowCrossProtocolRedirects(true)

            // Resolve streaming format types (prefer HLS .m3u8)
            val mimeType = if (channel.streamUrl.contains(".m3u8")) {
                MimeTypes.APPLICATION_M3U8
            } else {
                MimeTypes.APPLICATION_SS
            }

            val mediaItem = MediaItem.Builder()
                .setUri(Uri.parse(channel.streamUrl))
                .setMimeType(mimeType)
                .build()

            val mediaSource = HlsMediaSource.Factory(dataSourceFactory)
                .createMediaSource(mediaItem)

            exoPlayer.setMediaSource(mediaSource)
            exoPlayer.prepare()
        } catch (e: Exception) {
            errorMessage = "Player init error: \${e.localizedMessage}"
            isLoading = false
        }
    }

    // Connect state listener
    DisposableEffect(Unit) {
        val listener = object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                isLoading = when (state) {
                    Player.STATE_BUFFERING -> true
                    else -> false
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                errorMessage = "Stream playing failed (\$error). Retrying connection..."
                // Simple retry loop logic representing resilient recovery
                isLoading = true
                exoPlayer.prepare()
            }
        }
        exoPlayer.addListener(listener)
        onDispose {
            exoPlayer.removeListener(listener)
            exoPlayer.release()
        }
    }

    // Auto dismiss gesture instructions
    LaunchedEffect(Unit) {
        delay(4000)
        showGestureHint = false
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    // Detect vertical slide on left side (brightness - dummy check) or right side (volume)
                    if (change.position.x > size.width / 2) {
                        val sensitivity = 1000f
                        val volDelta = -dragAmount.y / sensitivity
                        currentVolume = (currentVolume + volDelta).coerceIn(0f, 1f)
                        exoPlayer.volume = currentVolume
                    }
                }
            }
    ) {
        // StyledPlayerView wrapper
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = exoPlayer
                    useController = true
                    layoutParams = FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Overlay status indicators
        if (isLoading) {
            CircularProgressIndicator(
                color = MaterialTheme.colorScheme.primary,
                modifier = Modifier.align(Alignment.Center)
            )
        }

        if (errorMessage != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.85f)),
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Filled.Warning, contentDescription = "Error", tint = Color.Red, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(errorMessage ?: "", color = Color.White, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            errorMessage = null
                            exoPlayer.prepare()
                        }
                    ) {
                        Text("Auto-Retry Stream")
                    }
                }
            }
        }

        // Custom Stream Header HUD Layer
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, "Back", tint = Color.White)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(channel.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text(
                    "Category: \${channel.category} | \${channel.quality ?: "Auto Quality"}",
                    color = Color.LightGray,
                    fontSize = 11.sp
                )
            }

            IconButton(onClick = onToggleFavorite) {
                Icon(
                    imageVector = if (isFavorite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                    contentDescription = "Favorite",
                    tint = if (isFavorite) Color.Red else Color.White
                )
            }
            IconButton(onClick = onShare) {
                Icon(Icons.Filled.Share, "Share", tint = Color.White)
            }
        }

        // Volume Indicator Sidebar Overlay
        Box(
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(24.dp)
                .background(Color.Black.copy(alpha = 0.6f), CircleShape)
                .padding(8.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = if (currentVolume == 0f) Icons.Filled.VolumeMute else Icons.Filled.VolumeUp,
                    contentDescription = "Volume",
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "\${(currentVolume * 100).toInt()}%",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Gesture Hints Helper
        if (showGestureHint) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.Black.copy(alpha = 0.75f)),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 80.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Info, "Gesture", tint = Color.Cyan)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("💡 Slide vertical on RIGHT side to control Volume dynamically", color = Color.White, fontSize = 12.sp)
                }
            }
        }
    }
}
`
  },
  {
    path: "app/src/main/java/com/tv/indiaiptv/presentation/screens/HomeScreen.kt",
    name: "HomeScreen.kt",
    language: "kotlin",
    description: "The Netflix, JioHotstar, and SonyLiv inspired dashboard interface containing categorical channels, recently watched continues, and featured autoplay layouts.",
    code: `package com.tv.indiaiptv.presentation.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tv.indiaiptv.domain.models.IPTVChannel
import com.tv.indiaiptv.presentation.viewmodels.IPTVUiState

@Composable
fun HomeScreen(
    uiState: IPTVUiState,
    onChannelSelect: (IPTVChannel) -> Unit,
    onForceRefresh: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color(0xFF0F0F0F)) // Netflix standard dark ambient Canvas
    ) {
        when (uiState) {
            is IPTVUiState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = MaterialTheme.colorScheme.primary
                )
            }
            is IPTVUiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Warning,
                        contentDescription = "Sync Error",
                        tint = Color.Red,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(uiState.message, color = Color.White, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(onClick = onForceRefresh) {
                        Text("Force Cache Sync")
                    }
                }
            }
            is IPTVUiState.Success -> {
                val channels = uiState.channels
                val categories = uiState.categories
                
                // Keep DD National as Featured/Hero channel
                val featuredChannel = channels.firstOrNull { it.id == "DDNational.in" } ?: channels.firstOrNull()

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(scrollState)
                ) {
                    // 1. Cinema Hero Banner Autoplay Section
                    featuredChannel?.let { HeroFeaturedBanner(channel = it, onWatch = { onChannelSelect(it) }) }

                    Spacer(modifier = Modifier.height(16.dp))

                    // 2. Continues Playing history row
                    val recentlyPlayed = channels.filter { uiState.watchCounts.containsKey(it.id) }
                        .sortedByDescending { uiState.watchCounts[it.id] }
                    if (recentlyPlayed.isNotEmpty()) {
                        ChannelSectionRow(
                            title = "Continue Watching",
                            channels = recentlyPlayed,
                            onChannelSelect = onChannelSelect
                        )
                    }

                    // 3. Dynamic Categories horizontal slides
                    categories.forEach { cat ->
                        const catChannels = channels.filter { it.category == cat }
                        if (catChannels.isNotEmpty()) {
                            ChannelSectionRow(
                                title = cat,
                                channels = catChannels,
                                onChannelSelect = onChannelSelect
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(100.dp))
                }
            }
        }
    }
}

@Composable
fun HeroFeaturedBanner(
    channel: IPTVChannel,
    onWatch: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(280.dp)
    ) {
        // Backing logo overlay
        AsyncImage(
            model = channel.logo,
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF1E1E1E))
        )

        // OTT dark vignette gradient
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            Color(0xBB000000),
                            Color(0xFF0F0F0F)
                        )
                    )
                )
        )

        // Contents
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier.padding(right = 8.dp)
                ) {
                    Text(
                        "LIVE CHANNEL",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }
                Text(channel.category, color = Color.Cyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                channel.name,
                color = Color.White,
                fontSize = 28.sp,
                fontWeight = FontWeight.Black
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row {
                Button(
                    onClick = onWatch,
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                    shape = RoundedCornerShape(4.dp),
                    modifier = Modifier.padding(right = 12.dp)
                ) {
                    Icon(Icons.Filled.PlayArrow, contentDescription = "Play")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Watch Now", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = onWatch,
                    shape = RoundedCornerShape(4.dp),
                    border = BorderStroke(1.dp, Color.White),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                ) {
                    Icon(Icons.Filled.Info, contentDescription = "Details")
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Details")
                }
            }
        }
    }
}

@Composable
fun ChannelSectionRow(
    title: String,
    channels: List<IPTVChannel>,
    onChannelSelect: (IPTVChannel) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp)
    ) {
        Text(
            text = title,
            color = Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 18.sp,
            modifier = Modifier.padding(horizontal = 16.dp, bottom = 8.dp)
        )
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(channels) { channel ->
                Card(
                    modifier = Modifier
                        .width(130.dp)
                        .height(140.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onChannelSelect(channel) },
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(80.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color.Black.copy(alpha = 0.3f))
                        ) {
                            AsyncImage(
                                model = channel.logo,
                                contentDescription = channel.name,
                                contentScale = ContentScale.Fit,
                                modifier = Modifier
                                    .padding(8.dp)
                                    .fillMaxSize()
                            )
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = channel.name,
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            modifier = Modifier.padding(horizontal = 8.dp)
                        )
                        Text(
                            text = channel.quality ?: "Auto",
                            color = Color.Gray,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                    }
                }
            }
        }
    }
}
`
  }
];
