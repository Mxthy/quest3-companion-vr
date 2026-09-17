extends Node
## Decision helper comments for agents (not runtime-critical).
##
## USE STOCK (XR Tools function / pickable):
## - standard grip grab, throw, teleport, snap turn, climb
##
## EXTEND (thin script + signals):
## - bond, dialogue, quest flags, soft “contact intensity” as pure data
## - filtering which items are grabbable by game phase
##
## FORK / custom physics hand only if:
## - stock pickable cannot meet wall-collision hand needs
## - then base on godot4-vr-physics-template mental model, still isolate domain
##
## NEVER:
## - duplicate grab raycast “because Unity sample did it”
## - name variables grab_target / held_object same as tools internals without reading tools code

func item_allowed_in_phase(item_id: StringName, phase: StringName) -> bool:
	if phase != &"playing":
		return false
	# Product rule example — this is the “Mehrwert”, not a new grab solver.
	return item_id in [&"cup", &"vinyl", &"lantern"]
