declare const __DEV__: boolean;

// lucide-react-native 0.544 supports `color` at runtime but omits it from its
// exported LucideProps type (it extends react-native-svg's SvgProps). Restore it.
declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string;
  }
}
