extends Node3D
## Pattern: XR Tools (or physics template) owns grab.
## This script only adds product value on signals.
## Wire: connect pickable picked_up / dropped (exact signal names = your Tools version).

@export var item_id: StringName = &"cup"

func _ready() -> void:
	# Example: parent is XRToolsPickable-compatible node.
	if has_signal("picked_up"):
		picked_up.connect(_on_picked_up)
	if has_signal("dropped"):
		dropped.connect(_on_dropped)

func _on_picked_up(_by: Variant = null) -> void:
	# Domain only — no reimplementation of attach math.
	DomainState.set_held(item_id)
	DomainState.add_bond(1)
	# Optional: audio / VRM reaction
	EventBus.item_held.emit(item_id)

func _on_dropped(_by: Variant = null) -> void:
	DomainState.clear_held(item_id)
	EventBus.item_released.emit(item_id)
