import { Component } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface Props {
  readonly children: React.ReactNode;
  readonly onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || "Error desconocido" };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Error en la aplicacion</Text>
          <Text style={styles.errorDetail}>{this.state.errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#0f0f23",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 16,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#ef4444",
    textAlign: "center",
    lineHeight: 72,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
    textAlign: "center",
  },
  errorDetail: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
