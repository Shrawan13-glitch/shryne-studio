import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Check, Clapperboard, FileInput, ListPlus, Sparkles, Users, Wand2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { BlockRow } from '@/components/editor/BlockRow';
import { VoicePicker } from '@/components/editor/VoicePicker';
import { RunSettingsSheet } from '@/components/editor/RunSettingsSheet';
import { useSaveScript, useScripts } from '@/hooks/useScripts';
import { useAppStore } from '@/stores/useAppStore';
import { useStartRun } from '@/hooks/useRuns';
import { compileScript, MIN_SPEED, MAX_SPEED } from '@/lib/tts/compile';
import { estimateRuntimeSeconds } from '@/lib/tts/sharding';
import { smartPaste } from '@/lib/tts/smartPaste';
import { newBatchId } from '@/lib/run/engine';
import { uid } from '@/lib/utils/id';
import type { Block, BlockType, CharacterProfile, RunConfig, Script } from '@/types';
import { DEFAULT_VOICE, voiceLabel } from '@/lib/tts/voices';

const DEFAULT_RUN_CONFIG: Omit<RunConfig, 'batchId' | 'scriptId' | 'scriptTitle'> = {
  shards: 1,
  strategy: 'contiguous',
  defaultVoice: DEFAULT_VOICE,
  defaultSpeed: 1,
  outputDir: 'tts-output',
  retentionDays: 1,
  cleanupAfterDownload: true,
  notifyOnFinish: true,
  cancelOnFailure: false,
};

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: scripts = [] } = useScripts();
  const save = useSaveScript();
  const start = useStartRun();
  const studio = useAppStore((state) => state.studio);
  const setActive = useAppStore((state) => state.setActiveScript);

  const stored = scripts.find((script) => script.id === id);
  const [script, setScript] = useState<Script | null>(stored ?? null);
  const [dirty, setDirty] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [voiceTarget, setVoiceTarget] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [castOpen, setCastOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (stored && (!script || stored.updatedAt !== script.updatedAt)) setScript(stored);
  }, [stored?.updatedAt]);

  useEffect(() => {
    if (!script || !dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save.mutateAsync({ ...script, updatedAt: Date.now() });
      setDirty(false);
    }, 700);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [script, dirty]);

  const compiled = useMemo(() => {
    if (!script) return null;
    return compileScript(script.blocks, newBatchId(), {
      voice: script.defaultVoice,
      speed: script.defaultSpeed,
      outputDir: script.outputDir,
    });
  }, [script]);

  if (!script) {
    return (
      <Screen>
        <Text className="mt-10 text-center text-sm text-zinc-400">Script not found.</Text>
        <Button label="Back to scripts" onPress={() => router.back()} className="mt-4" />
      </Screen>
    );
  }

  const patchScript = (patch: Partial<Script>) => {
    setScript((current) => (current ? { ...current, ...patch, updatedAt: Date.now() } : current));
    setDirty(true);
  };

  const updateBlock = (blockId: string, patch: Partial<Block>) => {
    patchScript({ blocks: script.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)) });
  };

  const addBlock = (type: BlockType) => {
    const block: Block = {
      id: uid('blk'),
      type,
      text: type === 'heading' ? 'SCENE TITLE' : type === 'silence' ? 'Pause' : '',
      speed: script.defaultSpeed,
      voice: script.defaultVoice,
      duration: type === 'silence' ? 0.5 : undefined,
      enabled: true,
    };
    patchScript({ blocks: [...script.blocks, block] });
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = [...script.blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    patchScript({ blocks: next });
  };

  const importPaste = () => {
    const blocks = smartPaste(pasteText, script.characters);
    if (!blocks.length) return;
    patchScript({ blocks: [...script.blocks, ...blocks] });
    setPasteText('');
    setPasteOpen(false);
  };

  const generate = async (config: RunConfig) => {
    if (!studio || !compiled) return;
    setSettingsOpen(false);
    const finalCompiled = compileScript(script.blocks, config.batchId, {
      voice: config.defaultVoice, speed: config.defaultSpeed, outputDir: config.outputDir,
    });
    const { run } = await start.mutateAsync({
      studio,
      scriptId: script.id,
      scriptTitle: script.title,
      compiled: finalCompiled,
      config,
    });
    setActive(script);
    router.push({ pathname: '/(app)/run/[id]', params: { id: run.id } });
  };

  const voiceTargetBlock = script.blocks.find((block) => block.id === voiceTarget);

  return (
    <Screen scroll={false}>
      <View className="flex-row items-center gap-3 border-b border-ink-800 pb-3 pt-1">
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-ink-850">
          <ArrowLeft size={18} color="#a1a1aa" />
        </Pressable>
        <View className="flex-1">
          <TextInput
            value={script.title}
            onChangeText={(title) => patchScript({ title })}
            className="text-lg font-bold text-zinc-50"
          />
          <Text className="text-[10px] text-zinc-500">{dirty ? 'Saving…' : 'Saved'}</Text>
        </View>
        <Pressable onPress={() => setCastOpen(true)} className="h-10 w-10 items-center justify-center rounded-full bg-ink-850">
          <Users size={18} color="#a78bfa" />
        </Pressable>
        <Pressable onPress={() => setPreflightOpen(true)} className="h-10 w-10 items-center justify-center rounded-full bg-ink-850">
          <Sparkles size={18} color="#a78bfa" />
        </Pressable>
      </View>

      <View className="flex-row gap-2 border-b border-ink-800 py-3">
        <ToolButton label="Line" onPress={() => addBlock('line')} />
        <ToolButton label="Heading" onPress={() => addBlock('heading')} />
        <ToolButton label="Direction" onPress={() => addBlock('direction')} />
        <ToolButton label="Pause" onPress={() => addBlock('silence')} />
        <ToolButton label="Paste" onPress={() => setPasteOpen(true)} />
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="pt-4">
          {script.blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              block={block}
              index={index}
              total={script.blocks.length}
              onChange={(patch) => updateBlock(block.id, patch)}
              onDelete={() => patchScript({ blocks: script.blocks.filter((item) => item.id !== block.id) })}
              onDuplicate={() => {
                const copy = { ...block, id: uid('blk') };
                const next = [...script.blocks];
                next.splice(index + 1, 0, copy);
                patchScript({ blocks: next });
              }}
              onMove={(direction) => moveBlock(index, direction)}
              onPickVoice={() => setVoiceTarget(block.id)}
            />
          ))}
        </View>
        <Pressable onPress={() => addBlock('line')} className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-700 py-4">
          <ListPlus size={17} color="#71717a" />
          <Text className="text-sm text-zinc-500">Add another line</Text>
        </Pressable>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-ink-800 bg-ink-950/95 px-5 pb-5 pt-3">
        <Button
          label={start.isPending ? 'Starting…' : `Generate ${compiled?.items.length ?? 0} lines`}
          onPress={() => setSettingsOpen(true)}
          disabled={!studio || !compiled || compiled.items.length === 0}
          loading={start.isPending}
        />
      </View>

      <VoicePicker
        visible={voiceTarget !== null}
        selected={voiceTargetBlock?.voice ?? script.defaultVoice}
        onSelect={(voiceId) => { if (voiceTarget) updateBlock(voiceTarget, { voice: voiceId }); setVoiceTarget(null); }}
        onClose={() => setVoiceTarget(null)}
      />

      <RunSettingsSheet
        visible={settingsOpen}
        initial={{
          ...DEFAULT_RUN_CONFIG,
          batchId: compiled?.batchId ?? newBatchId(),
          scriptId: script.id,
          scriptTitle: script.title,
          defaultVoice: script.defaultVoice,
          defaultSpeed: script.defaultSpeed,
          outputDir: script.outputDir,
        }}
        itemCount={compiled?.items.length ?? 0}
        onClose={() => setSettingsOpen(false)}
        onApply={(config) => void generate(config)}
      />

      <Modal visible={pasteOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPasteOpen(false)}>
        <Screen scroll={false}>
          <View className="mb-4 flex-row items-center justify-between pt-4">
            <Text className="text-xl font-bold text-zinc-50">Paste a script</Text>
            <Pressable onPress={() => setPasteOpen(false)}><Text className="text-sm text-brand-300">Close</Text></Pressable>
          </View>
          <Text className="mb-3 text-xs leading-5 text-zinc-500">
            Paste an entire script. Blank lines become blocks, NAME: cues are detected, and long paragraphs are split automatically.
          </Text>
          <TextInput
            value={pasteText}
            onChangeText={setPasteText}
            multiline
            placeholder={'NARRATOR: Welcome to the show.\n\nHERO: Let us begin.'}
            placeholderTextColor="#52525b"
            className="min-h-[240px] flex-1 rounded-2xl border border-ink-700 bg-ink-850 p-4 text-sm leading-6 text-zinc-100"
          />
          <Button label="Import into script" onPress={importPaste} disabled={!pasteText.trim()} className="mb-5 mt-3" />
        </Screen>
      </Modal>

      <Modal visible={preflightOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPreflightOpen(false)}>
        <Screen>
          <View className="mb-5 mt-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-zinc-50">Preflight check</Text>
            <Pressable onPress={() => setPreflightOpen(false)}><Text className="text-sm text-brand-300">Close</Text></Pressable>
          </View>
          <View className="mb-4 rounded-2xl border border-ink-700 bg-ink-850 p-4">
            <Text className="text-3xl font-black text-zinc-50">{compiled?.items.length ?? 0}</Text>
            <Text className="text-xs text-zinc-500">spoken lines</Text>
            <View className="mt-3 flex-row gap-6">
              <View><Text className="text-lg font-bold text-zinc-200">{compiled?.estimatedCharacters ?? 0}</Text><Text className="text-[10px] text-zinc-500">characters</Text></View>
              <View><Text className="text-lg font-bold text-zinc-200">~{Math.round((estimateRuntimeSeconds(compiled?.items ?? [], 1)) / 60)} min</Text><Text className="text-[10px] text-zinc-500">est. runtime</Text></View>
            </View>
          </View>
          {compiled?.warnings.length ? (
            <View className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              {compiled.warnings.map((warning) => <Text key={warning} className="mb-1 text-xs leading-5 text-amber-200">• {warning}</Text>)}
            </View>
          ) : (
            <View className="mb-4 flex-row items-center gap-2 rounded-2xl border border-mint-500/30 bg-mint-500/10 p-4">
              <Check size={16} color="#34d399" /><Text className="text-sm text-mint-400">Everything looks good.</Text>
            </View>
          )}
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">First lines</Text>
          {compiled?.items.slice(0, 5).map((item) => (
            <View key={item.filename} className="mb-2 rounded-xl bg-ink-850 p-3">
              <Text className="text-xs text-zinc-300" numberOfLines={2}>{item.text}</Text>
              <Text className="mt-1 text-[10px] text-zinc-600">{item.filename} · {voiceLabel(item.voice)} · {item.speed}x</Text>
            </View>
          ))}
        </Screen>
      </Modal>

      <Modal visible={castOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setCastOpen(false)}>
        <CastEditor script={script} onChange={(characters) => patchScript({ characters })} onClose={() => setCastOpen(false)} />
      </Modal>
    </Screen>
  );
}

function ToolButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-full border border-ink-700 bg-ink-850 px-3 py-2">
      <Text className="text-xs font-semibold text-zinc-300">+ {label}</Text>
    </Pressable>
  );
}

function CastEditor({ script, onChange, onClose }: { script: Script; onChange: (characters: CharacterProfile[]) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [voice, setVoice] = useState(DEFAULT_VOICE);
  const [speed, setSpeed] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);

  const add = () => {
    if (!name.trim()) return;
    onChange([...script.characters, { id: uid('char'), name: name.trim(), voice, speed, color: '#a78bfa' }]);
    setName('');
  };

  return (
    <Screen>
      <View className="mb-5 mt-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Clapperboard size={18} color="#a78bfa" />
          <Text className="text-xl font-bold text-zinc-50">Voice cast</Text>
        </View>
        <Pressable onPress={onClose}><Text className="text-sm text-brand-300">Done</Text></Pressable>
      </View>
      <Text className="mb-4 text-xs leading-5 text-zinc-500">
        Map character names to voices. When you paste a script, lines starting with “NAME:” get the matching voice automatically.
      </Text>
      {script.characters.map((profile) => (
        <View key={profile.id} className="mb-2 flex-row items-center justify-between rounded-2xl border border-ink-700 bg-ink-850 p-3">
          <View>
            <Text className="text-sm font-semibold text-zinc-100">{profile.name}</Text>
            <Text className="text-xs text-zinc-500">{voiceLabel(profile.voice)} · {profile.speed}x</Text>
          </View>
          <Pressable onPress={() => onChange(script.characters.filter((item) => item.id !== profile.id))}>
            <Text className="text-xs text-red-300">Remove</Text>
          </Pressable>
        </View>
      ))}
      <View className="mt-4 rounded-2xl border border-ink-700 bg-ink-850 p-4">
        <TextInput value={name} onChangeText={setName} placeholder="Character name" placeholderTextColor="#71717a" className="mb-3 h-12 rounded-xl bg-ink-800 px-3 text-sm text-zinc-100" />
        <Pressable onPress={() => setPickerOpen(true)} className="mb-3 rounded-xl bg-ink-800 px-3 py-3">
          <Text className="text-sm text-zinc-200">{voiceLabel(voice)}</Text>
        </Pressable>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs text-zinc-400">Speed {speed.toFixed(2)}x</Text>
          <View className="flex-row gap-2">
            <Pressable onPress={() => setSpeed(Math.max(MIN_SPEED, speed - 0.1))} className="rounded-lg bg-ink-800 px-3 py-1.5"><Text className="text-zinc-300">−</Text></Pressable>
            <Pressable onPress={() => setSpeed(Math.min(MAX_SPEED, speed + 0.1))} className="rounded-lg bg-ink-800 px-3 py-1.5"><Text className="text-zinc-300">+</Text></Pressable>
          </View>
        </View>
        <Button label="Add character" onPress={add} disabled={!name.trim()} />
      </View>
      <VoicePicker visible={pickerOpen} selected={voice} onSelect={setVoice} onClose={() => setPickerOpen(false)} />
      <View className="h-10" />
    </Screen>
  );
}
