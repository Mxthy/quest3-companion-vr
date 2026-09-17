extends Node
## Autoload-style domain state. Agents: keep this free of XR node paths.
## XR layer calls in; UI/VRM read out.

var phase: StringName = &"start"
var bond: int = 0
var held: StringName = &""

func enter_play() -> void:
	phase = &"playing"

func set_held(id: StringName) -> void:
	held = id

func clear_held(id: StringName) -> void:
	if held == id:
		held = &""

func add_bond(n: int) -> void:
	bond = maxi(0, bond + n)
