package com.zevra.questcompanion;

import java.util.concurrent.CopyOnWriteArrayList;

/**
 * JNI receiving end of native ContactSampler events.
 * The native layer pushes one call per classified touch; listeners (future
 * session/renderer glue, logging, or a JS bridge) subscribe here.
 */
public final class ContactBridge {

    public interface ContactListener {
        void onContact(int region, float intensity, float durationMs, long timestampNs);
    }

    private static final CopyOnWriteArrayList<ContactListener> LISTENERS =
            new CopyOnWriteArrayList<>();

    private ContactBridge() {
        // static only
    }

    public static void addListener(ContactListener listener) {
        LISTENERS.add(listener);
    }

    public static void removeListener(ContactListener listener) {
        LISTENERS.remove(listener);
    }

    /** Called from C++ per ContactEvent. Signature matches JNI "(IFFJ)V". */
    public static void onNativeContact(
            int region,
            float intensity,
            float durationMs,
            long timestampNs) {
        for (ContactListener listener : LISTENERS) {
            listener.onContact(region, intensity, durationMs, timestampNs);
        }
    }
}
