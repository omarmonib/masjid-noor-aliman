# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ============================================================
# Capacitor — required keep rules
# ============================================================
# Capacitor's Plugin.getPermissionStates() reads plugin permission
# definitions via reflection on annotations (@CapacitorPlugin,
# @Permission, @PermissionCallback). Without these keep rules, R8
# strips/obfuscates that structure and every permission check
# (checkPermissions/requestPermissions) crashes with a
# NullPointerException at runtime — this was the root cause of the
# app crashing whenever a plugin's permission flow ran (e.g. tapping
# the notification bell, or the native Adhan scheduler checking
# notification/exact-alarm permissions in the background).

-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

-keep @interface com.getcapacitor.annotation.CapacitorPlugin
-keep @interface com.getcapacitor.annotation.Permission
-keep @interface com.getcapacitor.annotation.PermissionCallback
-keep @interface com.getcapacitor.PluginMethod

-keep public class * extends com.getcapacitor.Plugin
-keepclassmembers public class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PermissionCallback <methods>;
    @com.getcapacitor.PluginMethod <methods>;
    public <init>(...);
}

-keep public class * extends com.getcapacitor.plugin.util.HttpRequestHandler

# WebView JS bridge interface methods must survive minification
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ============================================================
# Project's specific Capacitor plugins
# ============================================================
-keep class com.capacitorjs.plugins.localnotifications.** { *; }
-keep class com.capacitorjs.plugins.app.** { *; }
-keep class com.capacitorjs.plugins.browser.** { *; }
-keep class com.capacitorjs.plugins.splashscreen.** { *; }
-keep class com.capacitorjs.plugins.statusbar.** { *; }

# Cordova plugin support (bundled via capacitor-cordova-android-plugins)
-keep class org.apache.cordova.** { *; }
-keepclassmembers class org.apache.cordova.** { *; }