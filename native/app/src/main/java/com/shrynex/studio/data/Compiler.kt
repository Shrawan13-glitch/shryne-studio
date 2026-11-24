package com.shrynex.studio.data

import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

object Compiler {
    fun slug(input: String, limit: Int = 32): String {
        val value = input.replace(Regex("[^\\w\\s-]"), "").trim().replace(Regex("\\s+"), "_")
        return value.take(limit).ifEmpty { "line" }
    }

    fun clampSpeed(value: Double): Double = max(0.5, min(2.0, value)).let { Math.round(it * 100) / 100.0 }

    fun compile(blocks: List<Block>, defaults: Script): Compiled {
        val items = mutableListOf<Item>()
        val silences = mutableListOf<Pair<Int, Double>>()
        val warnings = mutableListOf<String>()
        val used = mutableSetOf<String>()

        blocks.forEachIndexed { index, block ->
            if (!block.enabled) return@forEachIndexed
            if (block.type == "silence") {
                silences.add(max(0, items.size - 1) to max(0.1, min(30.0, block.duration)))
                return@forEachIndexed
            }
            if (block.type != "line") return@forEachIndexed
            val text = block.text.replace(Regex("\\s+"), " ").trim()
            if (text.isEmpty()) return@forEachIndexed

            val voice = if (block.voice != null && Voices.valid(block.voice!!)) block.voice!! else defaults.defaultVoice
            val speed = clampSpeed(if (block.speed == 0.0) defaults.defaultSpeed else block.speed)
            if (text.length > 240) warnings.add("Line ${index + 1} is ${text.length} chars; under ~240 sounds best.")
            if (block.voice != null && !Voices.valid(block.voice!!)) warnings.add("Line ${index + 1} has an unknown voice.")

            val prefix = String.format("%04d", items.size + 1)
            val base = slug(block.filename?.takeIf { it.isNotBlank() } ?: text)
            var filename = "$prefix-$base"
            var suffix = 2
            while (used.contains(filename)) filename = "$prefix-$base-${suffix++}"
            used.add(filename)
            items.add(Item(text, voice, speed, filename))
        }
        if (items.isEmpty()) warnings.add("No spoken lines are enabled.")
        return Compiled("b${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(7)}", items, silences, warnings)
    }
}

fun Compiled.toItemsJson(): String {
    val array = JSONArray()
    items.forEach { item ->
        val obj = JSONObject()
        obj.put("text", item.text)
        obj.put("voice", item.voice)
        obj.put("speed", item.speed)
        obj.put("filename", item.filename)
        array.put(obj)
    }
    return array.toString()
}

fun Compiled.toShardJson(shards: Int, strategy: String): List<String> {
    val count = max(1, min(shards, max(1, items.size)))
    val groups = List(count) { mutableListOf<Item>() }
    if (strategy == "round-robin") {
        items.forEachIndexed { i, item -> groups[i % count].add(item) }
    } else {
        val size = (items.size + count - 1) / count
        items.forEachIndexed { i, item -> groups[min(count - 1, i / size)].add(item) }
    }
    return groups.map { group ->
        val array = JSONArray()
        group.forEach { item ->
            val obj = JSONObject()
            obj.put("text", item.text)
            obj.put("voice", item.voice)
            obj.put("speed", item.speed)
            obj.put("filename", item.filename)
            array.put(obj)
        }
        array.toString()
    }
}
