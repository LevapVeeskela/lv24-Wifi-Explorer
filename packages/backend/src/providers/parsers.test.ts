// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseNmcliWifiList, securityFromLabel } from './linux';
import { parseNetshNetworks } from './windows';

const NMCLI = [
  '00:11:22:33:44:55:LV24\\:Lab:36:5180:80:WPA2',
  'AA:BB:CC:DD:EE:FF::6:2437:42:WPA3',
  '02:00:00:00:00:01:Random:1:2412:20:--',
].join('\n');

describe('linux nmcli parser', () => {
  it('parses escaped SSID colons and derives RSSI from quality', () => {
    const records = parseNmcliWifiList(NMCLI);
    expect(records).toHaveLength(3);
    expect(records[0]?.ssid).toBe('LV24:Lab');
    expect(records[0]?.rssiDbm).toBe(-60);
    expect(records[0]?.channelBand).toBe('5ghz');
    expect(records[0]?.supportedSecurity).toEqual(['wpa2-personal']);
    expect(records[1]?.supportedSecurity).toEqual(['wpa3-personal']);
    expect(records[2]?.ssid).toBe('Random');
    expect(records[2]?.supportedSecurity).toEqual(['open']);
  });

  it('never invents widths or IEs', () => {
    const [record] = parseNmcliWifiList(NMCLI);
    expect(record?.channelWidth).toBe('unknown');
    expect(record?.informationElementData).toBeNull();
  });

  it('classifies mixed security labels by the strongest mode', () => {
    expect(securityFromLabel('WPA1 WPA2')).toEqual(['wpa2-personal']);
    expect(securityFromLabel('WPA2 Enterprise')).toEqual(['wpa2-enterprise']);
    expect(securityFromLabel('WEP')).toEqual(['wep']);
  });
});

const NETSH = `SSID 1 : LV24-Office
    Network type            : Infrastructure
    Authentication          : WPA2-Personal
    Encryption              : CCMP
    BSSID 1                 : 00:11:22:33:44:55
         Signal             : 82%
         Radio type         : 802.11ac
         Channel            : 36

SSID 2 :
    Network type            : Infrastructure
    Authentication          : Open
    Encryption              : None
    BSSID 1                 : 02:11:22:33:44:66
         Signal             : 40%
         Radio type         : 802.11n
         Channel            : 6
`;

const NETSH_RU = `Имя интерфейса: Беспроводная сеть 2
Сейчас видно следующее количество сетей: 3.

SSID 1: ZTE-ac9888
    Тип сети:                 Инфраструктура
    Проверка подлинности:     WPA2-Personal
    Шифрование:               CCMP
    BSSID 1                 : 30:0c:23:ac:98:88
         Сигнал             : 57%
         Тип радио         : 802.11n
         Диапазон               : 2,4 ГГц
         Канал            : 1
         Поддерживается QoS MSCS: 0

SSID 2: byfly WIFI
    Тип сети:                 Инфраструктура
    Проверка подлинности:     Открыть
    Шифрование:               Нет
    BSSID 1                 : 72:0c:23:ac:ee:87
         Сигнал             : 57%
         Тип радио         : 802.11n
         Диапазон               : 2,4 ГГц
         Канал            : 6
    BSSID 2                 : 72:0c:23:ad:8d:db
         Сигнал             : 80%
         Тип радио         : 802.11n
         Диапазон               : 2,4 ГГц
         Канал            : 11

SSID 3: ZTE-acee86
    Тип сети:                 Инфраструктура
    Проверка подлинности:     WPA2-Personal
    Шифрование:               CCMP
    BSSID 1                 : 30:0c:23:ac:ee:86
         Сигнал             : 57%
         Тип радио         : 802.11n
         Диапазон               : 2,4 ГГц
         Канал            : 6
`;

describe('windows netsh parser', () => {
  it('parses English BSS blocks, security and channel', () => {
    const records = parseNetshNetworks(NETSH);
    expect(records).toHaveLength(2);
    expect(records[0]?.ssid).toBe('LV24-Office');
    expect(records[0]?.channelNumber).toBe(36);
    expect(records[0]?.channelBand).toBe('5ghz');
    expect(records[0]?.rssiDbm).toBe(-59);
    expect(records[0]?.supportedSecurity).toEqual(['wpa2-personal']);
    expect(records[0]?.supportedPhyModes).toEqual(['ac']);
    expect(records[1]?.ssid).toBeNull();
    expect(records[1]?.channelBand).toBe('2ghz');
  });

  it('parses localized Russian output without inventing defaults', () => {
    const records = parseNetshNetworks(NETSH_RU);

    expect(records).toHaveLength(4);
    const zte = records.find((record) => record.ssid === 'ZTE-ac9888');
    expect(zte?.bssid).toBe('30:0c:23:ac:98:88');
    expect(zte?.rssiDbm).toBe(-71);
    expect(zte?.channelNumber).toBe(1);
    expect(zte?.channelBand).toBe('2ghz');
    expect(zte?.supportedSecurity).toEqual(['wpa2-personal']);
    expect(zte?.supportedPhyModes).toEqual(['n']);
    expect(zte?.channelWidth).toBe('unknown');
    expect(zte?.informationElementData).toBeNull();
    expect(Number.isNaN(zte?.noiseDbm)).toBe(true);
    expect(Number.isNaN(zte?.beaconIntervalMs)).toBe(true);

    const byfly = records.filter((record) => record.ssid === 'byfly WIFI');
    expect(byfly.map((record) => record.channelNumber)).toEqual([6, 11]);
    expect(byfly.map((record) => record.supportedSecurity)).toEqual([['open'], ['open']]);
  });

  it('drops a BSS entry when the signal cannot be parsed', () => {
    const noSignal = `SSID 1 : No-Signal
    Network type            : Infrastructure
    Authentication          : WPA2-Personal
    Encryption              : CCMP
    BSSID 1                 : 00:11:22:33:44:55
         Radio type         : 802.11ac
         Channel            : 36
`;
    expect(parseNetshNetworks(noSignal)).toEqual([]);
  });
});
