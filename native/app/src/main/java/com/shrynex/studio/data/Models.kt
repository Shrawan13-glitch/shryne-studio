package com.shrynex.studio.data

import java.util.UUID

data class Block(
    val id: String = UUID.randomUUID().toString(),
    val type: String = "line",
    var text: String = "",
    var voice: String? = null,
    var speed: Double = 1.0,
    var filename: String? = null,
    var enabled: Boolean = true,
    var duration: Double = 0.5,
)

data class Script(
    val id: String = UUID.randomUUID().toString(),
    var title: String = "Untitled script",
    val blocks: MutableList<Block> = mutableListOf(),
    var defaultVoice: String = Voices.DEFAULT,
    var defaultSpeed: Double = 1.0,
    var outputDir: String = "tts-output",
    var updatedAt: Long = System.currentTimeMillis(),
)

data class Item(
    val text: String,
    val voice: String,
    val speed: Double,
    val filename: String,
)

data class Compiled(
    val batchId: String,
    val items: List<Item>,
    val silences: List<Pair<Int, Double>>,
    val warnings: List<String>,
)

data class Run(
    val id: String = UUID.randomUUID().toString(),
    val batchId: String = "",
    val scriptId: String = "",
    val scriptTitle: String = "",
    val repo: String = "",
    var runId: Long? = null,
    var state: String = "queued",
    var shards: Int = 1,
    var step: String = "Waiting",
    var downloaded: Boolean = false,
    var strategy: String = "contiguous",
    var retentionDays: Int = 1,
    var cleanup: Boolean = true,
    var error: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    var compiledJson: String = "[]",
)

data class Asset(
    val id: String = UUID.randomUUID().toString(),
    val batchId: String = "",
    val filename: String = "",
    val text: String = "",
    val voice: String = "",
    val speed: Double = 1.0,
    val uri: String = "",
    val index: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
)
