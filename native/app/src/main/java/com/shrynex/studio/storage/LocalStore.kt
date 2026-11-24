package com.shrynex.studio.storage

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.shrynex.studio.data.Asset
import com.shrynex.studio.data.Run
import com.shrynex.studio.data.Script

class LocalStore(context: Context) {
    private val prefs = context.getSharedPreferences("shryne_local", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun scripts(): MutableList<Script> = gson.fromJson(
        prefs.getString("scripts", "[]"),
        object : TypeToken<MutableList<Script>>() {}.type,
    ) ?: mutableListOf()

    fun saveScripts(value: List<Script>) = prefs.edit().putString("scripts", gson.toJson(value)).apply()

    fun runs(): MutableList<Run> = gson.fromJson(
        prefs.getString("runs", "[]"),
        object : TypeToken<MutableList<Run>>() {}.type,
    ) ?: mutableListOf()

    fun saveRuns(value: List<Run>) = prefs.edit().putString("runs", gson.toJson(value)).apply()

    fun assets(): MutableList<Asset> = gson.fromJson(
        prefs.getString("assets", "[]"),
        object : TypeToken<MutableList<Asset>>() {}.type,
    ) ?: mutableListOf()

    fun saveAssets(value: List<Asset>) = prefs.edit().putString("assets", gson.toJson(value)).apply()
}
