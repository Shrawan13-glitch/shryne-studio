package com.shrynex.studio.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shrynex.studio.data.Block
import com.shrynex.studio.data.Script
import com.shrynex.studio.data.Voices
import com.shrynex.studio.vm.StudioViewModel
import kotlinx.coroutines.delay

@Composable
fun AppRoot(vm: StudioViewModel = viewModel()) {
    if (!vm.connected.value) {
        Onboarding(vm)
    } else {
        MainShell(vm)
    }
}

@Composable
private fun Banner(vm: StudioViewModel) {
    vm.error.value?.let { message ->
        Card(modifier = Modifier.fillMaxWidth().padding(12.dp)) {
            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(message, color = androidx.compose.ui.graphics.Color(0xFFF87171), fontSize = 12.sp, modifier = Modifier.weight(1f))
                TextButton(onClick = { vm.clearError() }) { Text("OK") }
            }
        }
    }
    vm.status.value?.let { message ->
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            CircularProgressIndicator(modifier = androidx.compose.ui.Modifier.height(18.dp).padding(end = 8.dp))
            Text(message, fontSize = 12.sp)
        }
    }
}

@Composable
private fun Onboarding(vm: StudioViewModel) {
    var token by remember { mutableStateOf("") }
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("Shryne Studio", fontSize = 30.sp)
        Text("Turn scripts into speech with GitHub Actions.", fontSize = 14.sp)
        Spacer(Modifier.height(24.dp))
        OutlinedTextField(
            value = token,
            onValueChange = { token = it },
            label = { Text("GitHub personal access token") },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
        )
        Text("Fine-grained token with Contents + Actions write, or classic with repo + workflow.", fontSize = 11.sp)
        Spacer(Modifier.height(16.dp))
        Button(onClick = { vm.connect(token) }, enabled = token.isNotBlank() && !vm.busy.value, modifier = Modifier.fillMaxWidth()) {
            Text(if (vm.busy.value) "Connecting…" else "Connect GitHub")
        }
        Banner(vm)
    }
}

@Composable
private fun MainShell(vm: StudioViewModel) {
    var tab by remember { mutableIntStateOf(0) }
    var editing by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        while (true) {
            vm.refreshRuns()
            delay(6000)
        }
    }

    if (editing != null) {
        val script = vm.scripts.find { it.id == editing }
        if (script != null) {
            EditorScreen(vm, script, onBack = { editing = null })
        } else {
            editing = null
        }
        return
    }

    Scaffold(
        bottomBar = {
            NavigationBar {
                val labels = listOf("Scripts", "Voices", "Runs", "Library", "Settings")
                labels.forEachIndexed { index, label ->
                    NavigationBarItem(
                        selected = tab == index,
                        onClick = { tab = index },
                        icon = {},
                        label = { Text(label, fontSize = 10.sp) },
                    )
                }
            }
        },
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            Banner(vm)
            when (tab) {
                0 -> ScriptsScreen(vm, onEdit = { editing = it })
                1 -> VoicesScreen()
                2 -> RunsScreen(vm)
                3 -> LibraryScreen(vm)
                4 -> SettingsScreen(vm)
            }
        }
    }
}

@Composable
private fun ScriptsScreen(vm: StudioViewModel, onEdit: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        Button(onClick = { onEdit(vm.newScript().id) }, modifier = Modifier.fillMaxWidth()) { Text("New script") }
        Spacer(Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(vm.scripts.toList(), key = { it.id }) { script ->
                Card(modifier = Modifier.fillMaxWidth().clickable { onEdit(script.id) }) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(script.title)
                            Text("${script.blocks.count { it.type == "line" }} lines", fontSize = 11.sp)
                        }
                        TextButton(onClick = { vm.deleteScript(script.id) }) { Text("Delete") }
                    }
                }
            }
        }
    }
}

@Composable
private fun EditorScreen(vm: StudioViewModel, script: Script, onBack: () -> Unit) {
    var pasteOpen by remember { mutableStateOf(false) }
    var pasteText by remember { mutableStateOf("") }
    var generateOpen by remember { mutableStateOf(false) }
    var voiceTarget by remember { mutableStateOf<Block?>(null) }
    var shards by remember { mutableIntStateOf(1) }
    var strategy by remember { mutableStateOf("contiguous") }
    var retention by remember { mutableIntStateOf(1) }
    var cleanup by remember { mutableStateOf(true) }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onBack) { Text("Back") }
            OutlinedTextField(
                value = script.title,
                onValueChange = { script.title = it; vm.saveScript(script) },
                modifier = Modifier.weight(1f),
                singleLine = true,
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Button(onClick = { script.blocks.add(Block(text = "New line", voice = script.defaultVoice)); vm.saveScript(script) }) { Text("+ Line") }
            Button(onClick = { script.blocks.add(Block(type = "heading", text = "SCENE")); vm.saveScript(script) }) { Text("+ Heading") }
            Button(onClick = { script.blocks.add(Block(type = "silence", text = "Pause", duration = 0.5)); vm.saveScript(script) }) { Text("+ Pause") }
            Button(onClick = { pasteOpen = true }) { Text("Paste") }
        }
        Spacer(Modifier.height(8.dp))
        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            items(script.blocks.toList(), key = { it.id }) { block ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        OutlinedTextField(
                            value = block.text,
                            onValueChange = { value -> block.text = value; vm.saveScript(script) },
                            label = { Text(block.type.uppercase()) },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        if (block.type == "line") {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                TextButton(onClick = { voiceTarget = block }) { Text(Voices.label(block.voice ?: script.defaultVoice)) }
                                TextButton(onClick = { block.speed = Math.max(0.5, block.speed - 0.1); vm.saveScript(script) }) { Text("-") }
                                Text("${block.speed.toInt()}", fontSize = 12.sp)
                                TextButton(onClick = { block.speed = Math.min(2.0, block.speed + 0.1); vm.saveScript(script) }) { Text("+") }
                                TextButton(onClick = { script.blocks.removeAll { it.id == block.id }; vm.saveScript(script) }) { Text("Delete") }
                            }
                        }
                    }
                }
            }
        }
        Button(onClick = { generateOpen = true }, modifier = Modifier.fillMaxWidth()) {
            Text("Generate ${script.blocks.count { it.type == "line" && it.enabled }} lines")
        }
    }

    if (pasteOpen) {
        AlertDialog(
            onDismissRequest = { pasteOpen = false },
            title = { Text("Paste a script") },
            text = {
                OutlinedTextField(value = pasteText, onValueChange = { pasteText = it }, label = { Text("Script text") }, minLines = 6)
            },
            confirmButton = {
                TextButton(onClick = { vm.smartPaste(pasteText, script); pasteText = ""; pasteOpen = false }) { Text("Import") }
            },
            dismissButton = { TextButton(onClick = { pasteOpen = false }) { Text("Cancel") } },
        )
    }

    if (voiceTarget != null) {
        val target = voiceTarget!!
        AlertDialog(
            onDismissRequest = { voiceTarget = null },
            title = { Text("Choose voice") },
            text = {
                LazyColumn(modifier = Modifier.height(360.dp)) {
                    items(Voices.ALL, key = { it.id }) { voice ->
                        Text(
                            "${voice.name} · ${voice.region} (${voice.id})",
                            modifier = Modifier.fillMaxWidth().clickable {
                                target.voice = voice.id
                                vm.saveScript(script)
                                voiceTarget = null
                            }.padding(10.dp),
                        )
                    }
                }
            },
            confirmButton = { TextButton(onClick = { voiceTarget = null }) { Text("Close") } },
        )
    }

    if (generateOpen) {
        AlertDialog(
            onDismissRequest = { generateOpen = false },
            title = { Text("Generate") },
            text = {
                Column {
                    Text("Parallel shards: $shards")
                    Row {
                        listOf(1, 2, 4, 8, 12, 16).forEach { count ->
                            TextButton(onClick = { shards = count }) { Text(count.toString()) }
                        }
                    }
                    Text("Strategy: $strategy")
                    Row {
                        TextButton(onClick = { strategy = "contiguous" }) { Text("Contiguous") }
                        TextButton(onClick = { strategy = "round-robin" }) { Text("Round robin") }
                    }
                    Text("Artifact retention: $retention days")
                    Row {
                        listOf(1, 3, 7).forEach { days -> TextButton(onClick = { retention = days }) { Text("$days d") } }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TextButton(onClick = { cleanup = !cleanup }) { Text(if (cleanup) "Cleanup: ON" else "Cleanup: OFF") }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    generateOpen = false
                    vm.generate(script, shards, strategy, retention, cleanup)
                }) { Text("Start") }
            },
            dismissButton = { TextButton(onClick = { generateOpen = false }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun VoicesScreen() {
    var query by remember { mutableStateOf("") }
    val filtered = Voices.ALL.filter { voice ->
        query.isBlank() || "${voice.id} ${voice.name} ${voice.language} ${voice.region}".contains(query, ignoreCase = true)
    }
    Column(modifier = Modifier.fillMaxSize()) {
        OutlinedTextField(value = query, onValueChange = { query = it }, label = { Text("Search ${Voices.ALL.size} voices") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            items(filtered, key = { it.id }) { voice ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(voice.name)
                        Text("${voice.region} · ${voice.gender} · ${voice.language} · ${voice.id}", fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun RunsScreen(vm: StudioViewModel) {
    Column(modifier = Modifier.fillMaxSize()) {
        Button(onClick = { vm.refreshRuns() }, modifier = Modifier.fillMaxWidth()) { Text("Refresh status") }
        Spacer(Modifier.height(10.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(vm.runs.toList(), key = { it.id }) { run ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(run.scriptTitle)
                        Text("${run.state} · ${run.step} · ${run.shards} shards", fontSize = 11.sp)
                        if (run.error != null) Text(run.error!!, fontSize = 11.sp)
                        Row {
                            if (run.state == "success" && !run.downloaded) {
                                TextButton(onClick = { vm.download(run) }) { Text("Download") }
                            }
                            TextButton(onClick = { vm.deleteRun(run) }) { Text("Remove") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LibraryScreen(vm: StudioViewModel) {
    LazyColumn(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        items(vm.assets.toList(), key = { it.id }) { asset ->
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(asset.filename)
                        Text("${asset.voice} · ${asset.speed}x", fontSize = 11.sp)
                    }
                    TextButton(onClick = { vm.deleteAsset(asset) }) { Text("Delete") }
                }
            }
        }
    }
}

@Composable
private fun SettingsScreen(vm: StudioViewModel) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text("Account: ${vm.login.value}")
        Text("Repo: ${vm.repo.value}", fontSize = 12.sp)
        Spacer(Modifier.height(20.dp))
        Button(onClick = { vm.repairWorkflow() }, modifier = Modifier.fillMaxWidth()) { Text("Repair workflow") }
        Spacer(Modifier.height(10.dp))
        Button(onClick = { vm.disconnect() }, modifier = Modifier.fillMaxWidth()) { Text("Disconnect") }
    }
}
