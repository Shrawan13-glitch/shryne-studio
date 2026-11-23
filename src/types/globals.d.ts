declare const __DEV__: boolean;

// Importing first makes this a module augmentation (merges with the real types)
// instead of an ambient module declaration that replaces all icon exports.
import 'lucide-react-native';

// lucide-react-native 0.544 supports `color` at runtime but omits it from its
// exported LucideProps type (it extends react-native-svg's SvgProps). Restore it.
declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
  }
}
