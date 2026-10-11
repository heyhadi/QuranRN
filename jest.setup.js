// react-native-mmkv returns an in-memory mock under Jest, but importing it still loads the
// Nitro native module, which doesn't exist outside a device build. Stub it so the import succeeds.
jest.mock("react-native-nitro-modules", () => ({
    NitroModules: { createHybridObject: jest.fn() },
}));
