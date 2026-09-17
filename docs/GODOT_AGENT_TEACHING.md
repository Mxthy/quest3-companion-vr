# How to teach Fable / Astra Godot XR correctly

## Intent (product owner)

The agent must **not invent** grab/locomotion. It must:

1. **Recognize** the stock Godot/XR Tools pattern
2. **Reuse** node composition and signal flow
3. **Transfer** the same logic into our abstractions (DomainState, EventBus, phase rules)
4. Add **Mehrwert** only in the domain layer (companion, bond, content)

## Feed the agent (order)

1. `docs/GODOT_XR_MENTAL_MODELS.md`
2. `docs/godot_snippets/` (all files)
3. `docs/GODOT_AGENT_RULES.md`
4. `docs/GODOT_POC_SOURCES.md` (where the real implementations live)
5. Optional: paste a **short** excerpt from *their installed* XR Tools pickable script (license MIT — keep attribution in THIRD_PARTY)

## Prompt fragment (copy)

```text
Du schreibst Godot 4 GDScript für Quest OpenXR.
Lies GODOT_XR_MENTAL_MODELS.md und docs/godot_snippets/.
Greifen/Teleport/Bewegung: XR Tools oder dokumentierte Physics-Template-Muster — nicht neu erfinden.
Unser Mehrwert: DomainState, Signale, Bond, Phasen, Props.
Vor jeder neuen Physik-Idee: stock-Pfad nennen; nur begründen wenn stock nicht reicht.
Ausgabe: welche Nodes, welche Signale, welche 1 Domain-Datei — kein Parallel-Grab-System.
```

## Success criterion

Agent output names real node types (`XROrigin3D`, pickable/function scenes) and puts game rules in a **separate** script. If it pastes a full custom grab solver without citing Tools/template → reject and re-prompt with snippets.
