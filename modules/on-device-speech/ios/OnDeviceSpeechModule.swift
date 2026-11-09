import ExpoModulesCore
import Speech

// expo-speech-recognition only checks on-device support for the device's default locale and
// silently uses Apple's servers when the requested locale has no on-device model.
// This check lets the app hide dictation instead of falling back to the network.
public class OnDeviceSpeechModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OnDeviceSpeech")

    Function("supportsOnDeviceRecognition") { (localeIdentifier: String) -> Bool in
      guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: localeIdentifier)) else {
        return false
      }
      return recognizer.supportsOnDeviceRecognition
    }
  }
}
