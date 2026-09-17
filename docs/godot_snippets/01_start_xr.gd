extends Node3D
## Pattern: start OpenXR once; fail soft; don’t invent a custom “VR manager” API.
## Source mindset: Godot docs + XR template main scripts.

signal xr_started
signal xr_failed(reason: String)

func _ready() -> void:
	var xr := XRServer.find_interface("OpenXR")
	if xr == null:
		xr_failed.emit("OpenXR interface missing")
		return
	if xr.is_initialized():
		get_viewport().use_xr = true
		xr_started.emit()
		return
	if xr.initialize():
		get_viewport().use_xr = true
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
		xr_started.emit()
	else:
		xr_failed.emit("OpenXR initialize failed")
