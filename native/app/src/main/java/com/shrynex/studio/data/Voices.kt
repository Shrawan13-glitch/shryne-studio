package com.shrynex.studio.data

data class Voice(
    val id: String,
    val name: String,
    val gender: String,
    val language: String,
    val region: String,
)

object Voices {
    val ALL: List<Voice> = listOf(
        Voice("af_alloy", "Alloy", "female", "English", "United States"),
        Voice("af_aoede", "Aoede", "female", "English", "United States"),
        Voice("af_bella", "Bella", "female", "English", "United States"),
        Voice("af_heart", "Heart", "female", "English", "United States"),
        Voice("af_jessica", "Jessica", "female", "English", "United States"),
        Voice("af_kore", "Kore", "female", "English", "United States"),
        Voice("af_nicole", "Nicole", "female", "English", "United States"),
        Voice("af_nova", "Nova", "female", "English", "United States"),
        Voice("af_river", "River", "female", "English", "United States"),
        Voice("af_sarah", "Sarah", "female", "English", "United States"),
        Voice("af_sky", "Sky", "female", "English", "United States"),
        Voice("am_adam", "Adam", "male", "English", "United States"),
        Voice("am_echo", "Echo", "male", "English", "United States"),
        Voice("am_eric", "Eric", "male", "English", "United States"),
        Voice("am_fenrir", "Fenrir", "male", "English", "United States"),
        Voice("am_liam", "Liam", "male", "English", "United States"),
        Voice("am_michael", "Michael", "male", "English", "United States"),
        Voice("am_onyx", "Onyx", "male", "English", "United States"),
        Voice("am_puck", "Puck", "male", "English", "United States"),
        Voice("am_santa", "Santa", "male", "English", "United States"),
        Voice("bf_alice", "Alice", "female", "English", "United Kingdom"),
        Voice("bf_emma", "Emma", "female", "English", "United Kingdom"),
        Voice("bf_isabella", "Isabella", "female", "English", "United Kingdom"),
        Voice("bf_lily", "Lily", "female", "English", "United Kingdom"),
        Voice("bm_daniel", "Daniel", "male", "English", "United Kingdom"),
        Voice("bm_fable", "Fable", "male", "English", "United Kingdom"),
        Voice("bm_george", "George", "male", "English", "United Kingdom"),
        Voice("bm_lewis", "Lewis", "male", "English", "United Kingdom"),
        Voice("ff_siwis", "Siwis", "female", "French", "France"),
        Voice("ef_dora", "Dora", "female", "Spanish", "Spain"),
        Voice("em_alex", "Alex", "male", "Spanish", "Spain"),
        Voice("em_santa", "Santa", "male", "Spanish", "Spain"),
        Voice("pf_dora", "Dora", "female", "Portuguese", "Portugal"),
        Voice("pm_alex", "Alex", "male", "Portuguese", "Portugal"),
        Voice("pm_santa", "Santa", "male", "Portuguese", "Portugal"),
        Voice("hf_alpha", "Alpha", "female", "Hindi", "India"),
        Voice("hf_beta", "Beta", "female", "Hindi", "India"),
        Voice("if_sara", "Sara", "female", "Italian", "Italy"),
        Voice("im_nicola", "Nicola", "male", "Italian", "Italy"),
        Voice("jf_alpha", "Alpha", "female", "Japanese", "Japan"),
        Voice("jf_gongitsune", "Gongitsune", "female", "Japanese", "Japan"),
        Voice("jf_nezumi", "Nezumi", "female", "Japanese", "Japan"),
        Voice("jf_tebukuro", "Tebukuro", "female", "Japanese", "Japan"),
        Voice("jm_kumo", "Kumo", "male", "Japanese", "Japan"),
        Voice("zf_xiaobei", "Xiaobei", "female", "Chinese", "China"),
        Voice("zf_xiaoni", "Xiaoni", "female", "Chinese", "China"),
        Voice("zf_xiaoxiao", "Xiaoxiao", "female", "Chinese", "China"),
        Voice("zf_xiaoyi", "Xiaoyi", "female", "Chinese", "China"),
        Voice("zm_yunjian", "Yunjian", "male", "Chinese", "China"),
        Voice("zm_yunxi", "Yunxi", "male", "Chinese", "China"),
        Voice("zm_yunxia", "Yunxia", "male", "Chinese", "China"),
        Voice("zm_yunyang", "Yunyang", "male", "Chinese", "China"),
    )

    val BY_ID: Map<String, Voice> = ALL.associateBy { it.id }
    val LANGUAGES: List<String> = ALL.map { it.language }.distinct().sorted()
    const val DEFAULT = "af_sky"

    fun label(id: String): String {
        val voice = BY_ID[id] ?: return id
        return "${voice.name} · ${voice.region}"
    }

    fun valid(id: String): Boolean = BY_ID.containsKey(id)
}
