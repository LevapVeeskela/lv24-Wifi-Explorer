import '../channel.dart';

const dfs5GhzChannels = <int>{
  52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144,
};

bool inferDfsChannel(WifiBand? band, int channel) {
  if (band != WifiBand.ghz5) return false;
  return dfs5GhzChannels.contains(channel);
}
