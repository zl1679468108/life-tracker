import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Rect, Ellipse, Path, G, Line, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PageBackgroundProps {
  style?: any;
}

/** 首页 — 暖阳生活（含动画） */
export function HomeBackground({ style }: PageBackgroundProps) {
  const { width: screenW } = useWindowDimensions();
  const containerH = 250;
  const vx = (x: number) => (x / 480) * screenW;
  const vy = (y: number) => (y / 300) * containerH;
  const vs = (s: number) => (s / 480) * screenW;

  const pulse = useRef(new Animated.Value(0)).current;
  const petal1 = useRef(new Animated.Value(0)).current;
  const petal2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    const drift = (v: Animated.Value, d: number) => {
      setTimeout(() => Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start(), d);
    };
    drift(petal1, 0);
    drift(petal2, 1400);
  }, []);

  const starOp = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.6] });
  const starSc = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.4, 1] });

  return (
    <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="homeTint" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE8C8" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFE8C8" stopOpacity="0.12" />
            <Stop offset="1" stopColor="#FFD180" stopOpacity="0.08" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="480" height="300" fill="url(#homeTint)" />

        <G opacity={0.32}>
          <Circle cx={380} cy={70} r={42} fill="#FFB347" />
          <Circle cx={380} cy={70} r={30} fill="#FFD180" opacity={0.8} />
          <Circle cx={380} cy={70} r={18} fill="#FFE8A0" opacity={0.6} />
          <Circle cx={380} cy={70} r={10} fill="#FFF8D0" opacity={0.5} />
          <G stroke="#FFB347" strokeWidth={2} opacity={0.4} strokeLinecap="round">
            <Line x1={380} y1={18} x2={380} y2={24} />
            <Line x1={380} y1={116} x2={380} y2={122} />
            <Line x1={328} y1={70} x2={334} y2={70} />
            <Line x1={426} y1={70} x2={432} y2={70} />
            <Line x1={342} y1={32} x2={346} y2={36} />
            <Line x1={414} y1={104} x2={418} y2={108} />
            <Line x1={342} y1={108} x2={346} y2={104} />
            <Line x1={414} y1={36} x2={418} y2={32} />
          </G>
        </G>
        <G opacity={0.32}>
          <Ellipse cx={85} cy={55} rx={48} ry={22} fill="#C8E0F0" />
          <Ellipse cx={58} cy={62} rx={26} ry={18} fill="#D0E8F5" />
          <Ellipse cx={115} cy={62} rx={24} ry={16} fill="#D0E8F5" />
          <Ellipse cx={85} cy={40} rx={20} ry={12} fill="#D8F0F8" />
          <Ellipse cx={350} cy={110} rx={40} ry={18} fill="#C8E0F0" opacity={0.8} />
          <Ellipse cx={330} cy={116} rx={22} ry={14} fill="#D0E8F5" opacity={0.8} />
          <Ellipse cx={372} cy={116} rx={18} ry={12} fill="#D0E8F5" opacity={0.8} />
        </G>
        <G transform="translate(30, 100)" opacity={0.28}>
          <Rect x={12} y={40} width={80} height={60} rx={5} fill="#F5C4A0" />
          <Path d="M 6 40 L 52 5 L 98 40 Z" fill="#F0A870" />
          <Rect x={46} y={70} width={24} height={30} rx={4} fill="#E89460" />
          <Rect x={18} y={52} width={18} height={18} rx={3} fill="#FFE8D0" />
          <Rect x={68} y={52} width={18} height={18} rx={3} fill="#FFE8D0" />
          <Rect x={72} y={10} width={10} height={18} rx={2} fill="#E89460" />
        </G>
        <G transform="translate(370, 145)" opacity={0.22}>
          <Rect x={8} y={28} width={48} height={42} rx={3} fill="#F5D0B0" />
          <Path d="M 4 28 L 32 5 L 60 28 Z" fill="#F0B890" />
          <Rect x={28} y={50} width={16} height={20} rx={2} fill="#E8A070" />
          <Rect x={14} y={38} width={10} height={10} rx={2} fill="#FFE8D0" />
        </G>
        <G opacity={0.25}>
          <Rect x={140} y={155} width={8} height={45} rx={3} fill="#C89070" />
          <Circle cx={144} cy={138} r={26} fill="#80D0A8" />
          <Circle cx={128} cy={148} r={20} fill="#70C098" />
          <Circle cx={162} cy={148} r={20} fill="#90E0B8" />
          <Circle cx={144} cy={125} r={16} fill="#A0E8C8" />
          <Rect x={310} y={165} width={7} height={40} rx={2} fill="#C89070" />
          <Circle cx={313} cy={152} r={22} fill="#80D0A8" />
          <Circle cx={300} cy={160} r={16} fill="#70C098" />
          <Circle cx={328} cy={160} r={16} fill="#90E0B8" />
        </G>
        <G opacity={0.3}>
          <G transform="translate(110, 195)">
            <Circle cx={0} cy={0} r={8} fill="#FF8A80" />
            <Circle cx={0} cy={0} r={4} fill="#FFD180" />
            <Circle cx={10} cy={3} r={6} fill="#FFAB91" />
            <Circle cx={10} cy={3} r={3} fill="#FFE8A0" />
            <Circle cx={-7} cy={5} r={5} fill="#FFD180" />
            <Circle cx={-7} cy={5} r={2.5} fill="#FFE8A0" />
          </G>
          <G transform="translate(230, 200)">
            <Circle cx={0} cy={0} r={7} fill="#FFAB91" />
            <Circle cx={0} cy={0} r={3.5} fill="#FFE8A0" />
            <Circle cx={8} cy={3} r={5} fill="#FF8A80" />
            <Circle cx={8} cy={3} r={2.5} fill="#FFD180" />
          </G>
          <G transform="translate(330, 205)">
            <Circle cx={0} cy={0} r={8} fill="#FFD180" />
            <Circle cx={0} cy={0} r={4} fill="#FFF5E8" />
            <Circle cx={-8} cy={4} r={6} fill="#FF8A80" />
            <Circle cx={-8} cy={4} r={3} fill="#FFE8A0" />
          </G>
        </G>
        <G opacity={0.3} stroke="#C89070" strokeWidth={2.5} fill="none" strokeLinecap="round">
          <Path d="M 205 28 Q 211 21 217 28 Q 223 21 229 28" />
          <Path d="M 245 46 Q 249 40 253 46 Q 257 40 261 46" opacity={0.8} />
          <Path d="M 180 38 Q 184 33 188 38 Q 192 33 196 38" opacity={0.6} />
        </G>
        {/* 花瓣静态底 */}
        <G opacity={0.2}>
          <Ellipse cx={100} cy={85} rx={5} ry={10} fill="#FF8A80" transform="rotate(30, 100, 85)" />
          <Ellipse cx={280} cy={130} rx={4} ry={8} fill="#FFAB91" transform="rotate(-45, 280, 130)" />
        </G>
        {/* 光点静态底 */}
        <G opacity={0.16}>
          <Circle cx={180} cy={30} r={6} fill="#FFD180" />
          <Circle cx={340} cy={20} r={7} fill="#FFD180" />
          <Circle cx={420} cy={40} r={5} fill="#FFD180" />
          <Circle cx={260} cy={75} r={4} fill="#FFD180" />
          <Circle cx={150} cy={120} r={4} fill="#FFD180" />
        </G>
      </Svg>

      {/* 星光 */}
      <Animated.View style={{ position: 'absolute', left: vx(176), top: vy(26), opacity: starOp, transform: [{ scale: starSc }] }}>
        <Svg width={vs(8)} height={vs(8)} viewBox="0 0 12 12"><Circle cx={6} cy={6} r={6} fill="#FFD180" /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: vx(336), top: vy(16), opacity: starOp, transform: [{ scale: starSc }] }}>
        <Svg width={vs(9)} height={vs(9)} viewBox="0 0 14 14"><Circle cx={7} cy={7} r={7} fill="#FFD180" /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: vx(256), top: vy(71), opacity: starOp, transform: [{ scale: starSc }] }}>
        <Svg width={vs(6)} height={vs(6)} viewBox="0 0 8 8"><Circle cx={4} cy={4} r={4} fill="#FFD180" /></Svg>
      </Animated.View>

      {/* 花瓣 */}
      <Animated.View style={{ position: 'absolute', left: vx(95), top: petal1.interpolate({ inputRange: [0, 1], outputRange: [vy(78), vy(96)] }), opacity: petal1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.45, 0.15] }) }}>
        <Svg width={vs(10)} height={vs(14)} viewBox="0 0 8 14"><Ellipse cx={4} cy={7} rx={3.5} ry={6} fill="#FF8A80" transform="rotate(30, 4, 7)" /></Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: vx(275), top: petal2.interpolate({ inputRange: [0, 1], outputRange: [vy(124), vy(140)] }), opacity: petal2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.45, 0.15] }) }}>
        <Svg width={vs(8)} height={vs(12)} viewBox="0 0 8 14"><Ellipse cx={4} cy={7} rx={3.5} ry={6} fill="#FFAB91" transform="rotate(-45, 4, 7)" /></Svg>
      </Animated.View>
    </View>
  );
}

/** 工作台 — 明亮收纳（含动画） */
export function WorkbenchBackground({ style }: PageBackgroundProps) {
  const { width: screenW } = useWindowDimensions();
  const containerH = 250;
  const vx = (x: number) => (x / 480) * screenW;
  const vy = (y: number) => (y / 300) * containerH;
  const vs = (s: number) => (s / 480) * screenW;

  const pulse = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse2, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    }, 550);
  }, []);

  const op = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.55] });
  const sc = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.35, 1] });
  const op2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.5] });
  const sc2 = pulse2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] });

  return (
    <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="workbenchTint" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#E0F0E8" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#C8E8D8" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#B8E0D0" stopOpacity="0.08" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="480" height="300" fill="url(#workbenchTint)" />

        <G transform="translate(15, 80)" opacity={0.38}>
          <Rect x={18} y={32} width={105} height={75} rx={6} fill="#5DCAA5" />
          <Path d="M 123 32 L 148 20 L 148 88 L 123 100 Z" fill="#4AB898" />
          <Path d="M 18 32 L 44 14 L 148 20 L 123 32 Z" fill="#70D8B8" />
          <Rect x={58} y={30} width={26} height={80} rx={4} fill="#90E8D0" opacity={0.7} />
          <Rect x={38} y={52} width={36} height={22} rx={4} fill="#FFF5E8" />
          <Line x1={45} y1={60} x2={67} y2={60} stroke="#E8C8A0" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={45} y1={68} x2={62} y2={68} stroke="#E8C8A0" strokeWidth={2.5} strokeLinecap="round" />
        </G>
        <G transform="translate(370, 55)" opacity={0.38}>
          <Rect x={12} y={35} width={70} height={55} rx={6} fill="#85B7EB" />
          <Rect x={4} y={20} width={86} height={20} rx={5} fill="#A0C8F0" />
          <Path d="M 30 20 Q 30 5 47 5 Q 64 5 64 20" fill="none" stroke="#70A8D8" strokeWidth={3.5} strokeLinecap="round" />
          <Circle cx={33} cy={56} r={8} fill="#C0E0F8" opacity={0.8} />
          <Rect x={47} y={50} width={24} height={5} rx={2} fill="#C0E0F8" opacity={0.8} />
          <Rect x={47} y={62} width={18} height={5} rx={2} fill="#C0E0F8" opacity={0.8} />
        </G>
        <G transform="translate(130, 140)" opacity={0.36}>
          <Ellipse cx={28} cy={48} rx={26} ry={10} fill="#F4C0D1" />
          <Rect x={2} y={20} width={52} height={28} rx={3} fill="#E8A8B8" />
          <Ellipse cx={28} cy={20} rx={26} ry={10} fill="#F4D0E0" />
          <Ellipse cx={28} cy={16} rx={30} ry={8} fill="#F8E0E8" />
          <Rect x={12} y={30} width={32} height={12} rx={3} fill="#FFF5E8" />
          <Line x1={18} y1={36} x2={38} y2={36} stroke="#E8C8A0" strokeWidth={2} strokeLinecap="round" />
        </G>
        <G transform="translate(330, 155)" opacity={0.28}>
          <Ellipse cx={20} cy={36} rx={18} ry={7} fill="#B5D4F4" />
          <Rect x={2} y={14} width={36} height={22} rx={2} fill="#A0C0E8" />
          <Ellipse cx={20} cy={14} rx={18} ry={7} fill="#C8E0F8" />
          <Ellipse cx={20} cy={11} rx={20} ry={5} fill="#E0F0FF" />
          <Rect x={8} y={22} width={24} height={8} rx={2} fill="#FFF5E8" />
          <Line x1={12} y1={26} x2={28} y2={26} stroke="#E8C8A0" strokeWidth={1.5} strokeLinecap="round" />
        </G>
        <G opacity={0.32}>
          <G transform="translate(250, 65)">
            <Rect x={4} y={4} width={52} height={38} rx={4} fill="#FFE8C8" />
            <Rect x={30} y={4} width={26} height={12} rx={2} fill="#FFE0B0" />
            <Line x1={12} y1={18} x2={48} y2={18} stroke="#F5D0A0" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={12} y1={26} x2={42} y2={26} stroke="#F5D0A0" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={12} y1={34} x2={38} y2={34} stroke="#F5D0A0" strokeWidth={2.5} strokeLinecap="round" />
          </G>
          <G transform="translate(300, 75) rotate(12, 32, 24)">
            <Rect x={4} y={4} width={48} height={32} rx={4} fill="#D0E8F5" />
            <Line x1={12} y1={18} x2={44} y2={18} stroke="#B0D8E8" strokeWidth={2.5} strokeLinecap="round" />
            <Line x1={12} y1={26} x2={36} y2={26} stroke="#B0D8E8" strokeWidth={2.5} strokeLinecap="round" />
          </G>
        </G>
        <G opacity={0.32}>
          <G transform="translate(210, 28)">
            <Rect x={6} y={10} width={24} height={42} rx={5} fill="#F0997B" />
            <Circle cx={18} cy={18} r={3} fill="#FFF5E8" />
            <Line x1={18} y1={10} x2={18} y2={0} stroke="#F0997B" strokeWidth={2} />
            <Line x1={11} y1={32} x2={25} y2={32} stroke="#FFF5E8" strokeWidth={2} strokeLinecap="round" />
            <Line x1={11} y1={40} x2={25} y2={40} stroke="#FFF5E8" strokeWidth={2} strokeLinecap="round" />
          </G>
          <G transform="translate(100, 45)">
            <Rect x={6} y={8} width={18} height={35} rx={4} fill="#5DCAA5" opacity={0.8} />
            <Circle cx={15} cy={15} r={2.5} fill="#FFF5E8" />
            <Line x1={15} y1={8} x2={15} y2={0} stroke="#5DCAA5" strokeWidth={1.5} opacity={0.8} />
          </G>
        </G>
        <G transform="translate(390, 172)" opacity={0.28}>
          <Rect x={4} y={26} width={42} height={30} rx={4} fill="#F5D0A0" />
          <Rect x={0} y={4} width={42} height={24} rx={4} fill="#FFE0B8" />
          <Rect x={46} y={12} width={35} height={44} rx={4} fill="#B5D4F4" />
        </G>
        {/* 星星静态底 */}
        <G opacity={0.16}>
          <Path d="M 260 18 L 263 26 L 272 26 L 265 32 L 267 42 L 260 36 L 253 42 L 255 32 L 248 26 L 257 26 Z" fill="#FAC775" />
          <Path d="M 380 20 L 382 26 L 388 26 L 384 30 L 385 36 L 380 32 L 375 36 L 376 30 L 372 26 L 378 26 Z" fill="#FAC775" />
        </G>
        <G opacity={0.25}>
          <Circle cx={80} cy={50} r={6} fill="#5DCAA5" />
          <Circle cx={180} cy={25} r={4} fill="#F4C0D1" />
          <Circle cx={240} cy={60} r={3} fill="#85B7EB" />
          <Circle cx={360} cy={45} r={6} fill="#F0997B" />
          <Circle cx={430} cy={35} r={3} fill="#5DCAA5" />
          <Circle cx={110} cy={140} r={3} fill="#85B7EB" />
          <Circle cx={320} cy={55} r={4} fill="#F5D0A0" />
        </G>
      </Svg>

      {/* 闪烁星星 */}
      <Animated.View style={{ position: 'absolute', left: vx(256), top: vy(14), opacity: op, transform: [{ scale: sc }] }}>
        <Svg width={vs(16)} height={vs(20)} viewBox="0 0 26 30">
          <Path d="M 13 2 L 15 11 L 24 11 L 17 18 L 19 27 L 13 21 L 7 27 L 9 18 L 2 11 L 11 11 Z" fill="#FAC775" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: vx(376), top: vy(16), opacity: op2, transform: [{ scale: sc2 }] }}>
        <Svg width={vs(12)} height={vs(14)} viewBox="0 0 20 22">
          <Path d="M 10 2 L 12 9 L 19 9 L 13 14 L 15 21 L 10 16 L 5 21 L 7 14 L 1 9 L 8 9 Z" fill="#FAC775" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** 消息 — 活泼社交（含动画） */
export function MessagesBackground({ style }: PageBackgroundProps) {
  const { width: screenW } = useWindowDimensions();
  const containerH = 250;
  const vx = (x: number) => (x / 480) * screenW;
  const vy = (y: number) => (y / 300) * containerH;
  const vs = (s: number) => (s / 480) * screenW;

  const heartBeat = useRef(new Animated.Value(0)).current;
  const planeDrift = useRef(new Animated.Value(0)).current;
  const bellShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(heartBeat, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heartBeat, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(planeDrift, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(planeDrift, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bellShake, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bellShake, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();
  }, []);

  const heartScale = heartBeat.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] });
  const heartOp = heartBeat.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] });
  const planeY = planeDrift.interpolate({ inputRange: [0, 1], outputRange: [vy(140), vy(156)] });
  const planeOp = planeDrift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] });
  const bellRotate = bellShake.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-8deg', '0deg', '8deg', '0deg'] });

  return (
    <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="msgTint" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#D0E8F8" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#C8E0F0" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#E8D0F8" stopOpacity="0.06" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="480" height="300" fill="url(#msgTint)" />

        <G transform="translate(15, 42)" opacity={0.35}>
          <Rect x={12} y={12} width={88} height={48} rx={20} fill="#5DCAA5" />
          <Path d="M 12 48 L 28 58 L 30 48 Z" fill="#5DCAA5" />
          <Circle cx={30} cy={34} r={4} fill="#B8F0D8" opacity={0.8} />
          <Line x1={42} y1={34} x2={88} y2={34} stroke="#B8F0D8" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={42} y1={46} x2={75} y2={46} stroke="#B8F0D8" strokeWidth={3.5} strokeLinecap="round" />
        </G>
        <G transform="translate(385, 115)" opacity={0.35}>
          <Rect x={8} y={12} width={78} height={46} rx={18} fill="#F08080" />
          <Path d="M 86 36 L 74 52 L 72 36 Z" fill="#F08080" />
          <Line x1={22} y1={32} x2={76} y2={32} stroke="#FFD0D0" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={22} y1={44} x2={62} y2={44} stroke="#FFD0D0" strokeWidth={3.5} strokeLinecap="round" />
        </G>
        <G transform="translate(130, 92)" opacity={0.32}>
          <Rect x={8} y={8} width={78} height={44} rx={18} fill="#AFA9EC" />
          <Path d="M 86 34 L 72 46 L 70 34 Z" fill="#AFA9EC" />
          <Line x1={22} y1={26} x2={76} y2={26} stroke="#E0D8F8" strokeWidth={3.5} strokeLinecap="round" />
          <Line x1={22} y1={38} x2={62} y2={38} stroke="#E0D8F8" strokeWidth={3.5} strokeLinecap="round" />
        </G>
        <G transform="translate(280, 38)" opacity={0.32}>
          <Rect x={12} y={18} width={74} height={52} rx={5} fill="#F0997B" />
          <Path d="M 12 18 L 49 52 L 86 18 Z" fill="#E88868" />
          <Rect x={30} y={4} width={42} height={20} rx={3} fill="#FFF5E8" />
          <Line x1={36} y1={12} x2={66} y2={12} stroke="#F0D8B8" strokeWidth={2.5} strokeLinecap="round" />
          <Line x1={36} y1={18} x2={58} y2={18} stroke="#F0D8B8" strokeWidth={2.5} strokeLinecap="round" />
        </G>
        {/* 铃铛 - 带动画底座 */}
        <G transform="translate(430, 38)" opacity={0.18}>
          <Path d="M 18 5 Q 5 5 5 24 L 5 42 Q 5 45 2 48 L 34 48 Q 31 45 31 42 L 31 24 Q 31 5 18 5 Z" fill="#FAC775" />
          <Rect x={15} y={0} width={5} height={8} rx={3} fill="#EF9F27" />
          <Circle cx={18} cy={52} r={4} fill="#EF9F27" />
        </G>
        <G transform="translate(370, 145)" opacity={0.35}>
          <Path d="M 12 22 L 48 4 L 36 30 Z" fill="#85B7EB" />
          <Path d="M 48 4 L 36 30 L 54 35 Z" fill="#70A0D0" />
          <Path d="M 12 22 L 36 30 L 30 42 Z" fill="#A0C8F0" />
          <Path d="M 48 4 L 58 1" stroke="#85B7EB" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
          <Path d="M 54 35 L 64 38" stroke="#85B7EB" strokeWidth={1.5} strokeLinecap="round" opacity={0.4} />
        </G>
        <G transform="translate(75, 28)" opacity={0.28}>
          <Circle cx={16} cy={16} r={16} fill="#FAC775" />
          <Circle cx={11} cy={13} r={2.5} fill="#E89460" />
          <Circle cx={21} cy={13} r={2.5} fill="#E89460" />
          <Path d="M 6 22 Q 16 28 26 22" fill="none" stroke="#E89460" strokeWidth={2.5} strokeLinecap="round" />
          <Circle cx={7} cy={20} r={3} fill="#F08080" opacity={0.4} />
          <Circle cx={25} cy={20} r={3} fill="#F08080" opacity={0.4} />
        </G>
        <G opacity={0.28}>
          <G transform="translate(240, 145)">
            <Rect x={4} y={4} width={48} height={24} rx={10} fill="#5DCAA5" />
            <Line x1={14} y1={16} x2={42} y2={16} stroke="#D0F0E8" strokeWidth={2.5} strokeLinecap="round" />
          </G>
          <G transform="translate(340, 105)">
            <Rect x={4} y={4} width={44} height={22} rx={8} fill="#F4C0D1" />
            <Line x1={14} y1={15} x2={38} y2={15} stroke="#FFD0D8" strokeWidth={2.5} strokeLinecap="round" />
          </G>
          <G transform="translate(200, 178)">
            <Rect x={4} y={4} width={40} height={20} rx={8} fill="#AFA9EC" />
            <Line x1={14} y1={14} x2={34} y2={14} stroke="#E0D8F8" strokeWidth={2.5} strokeLinecap="round" />
          </G>
        </G>
        <G transform="translate(180, 52) rotate(10, 20, 16)" opacity={0.26}>
          <Rect x={4} y={4} width={30} height={22} rx={3} fill="#F0997B" />
          <Path d="M 4 4 L 19 16 L 34 4 Z" fill="#E88868" />
        </G>
        <G opacity={0.18}>
          <Path d="M 95 78 C 95 70, 86 64, 80 70 C 74 64, 65 70, 65 78 C 65 90, 80 100, 80 100 C 80 100, 95 90, 95 78 Z" fill="#F08080" />
          <Path d="M 400 78 C 400 72, 394 68, 388 72 C 382 68, 376 72, 376 78 C 376 88, 388 96, 388 96 C 388 96, 400 88, 400 78 Z" fill="#F08080" opacity={0.7} />
        </G>
        <G opacity={0.25}>
          <Circle cx={45} cy={28} r={4} fill="#5DCAA5" />
          <Circle cx={155} cy={24} r={3} fill="#AFA9EC" />
          <Circle cx={270} cy={55} r={6} fill="#F0997B" />
          <Circle cx={380} cy={28} r={3} fill="#85B7EB" />
          <Circle cx={355} cy={55} r={4} fill="#FAC775" />
          <Circle cx={120} cy={140} r={3} fill="#F08080" />
          <Circle cx={420} cy={95} r={4} fill="#5DCAA5" />
        </G>
      </Svg>

      {/* 铃铛抖动 */}
      <Animated.View style={{ position: 'absolute', left: vx(428), top: vy(34), transform: [{ rotate: bellRotate }] }}>
        <Svg width={vs(24)} height={vs(34)} viewBox="0 0 38 56">
          <Path d="M 18 5 Q 5 5 5 24 L 5 42 Q 5 45 2 48 L 34 48 Q 31 45 31 42 L 31 24 Q 31 5 18 5 Z" fill="#FAC775" />
          <Rect x={15} y={0} width={5} height={8} rx={3} fill="#EF9F27" />
          <Circle cx={18} cy={52} r={4} fill="#EF9F27" />
        </Svg>
      </Animated.View>

      {/* 心跳爱心 */}
      <Animated.View style={{ position: 'absolute', left: vx(62), top: vy(74), transform: [{ scale: heartScale }], opacity: heartOp }}>
        <Svg width={vs(28)} height={vs(26)} viewBox="0 0 36 36">
          <Path d="M 18 8 C 18 4, 12 2, 8 6 C 4 2, -2 4, -2 8 C -2 14, 8 22, 8 22 C 8 22, 18 14, 18 8 Z" fill="#F08080" transform="translate(12, 2)" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: vx(376), top: vy(74), transform: [{ scale: heartScale }], opacity: heartOp }}>
        <Svg width={vs(22)} height={vs(20)} viewBox="0 0 30 30">
          <Path d="M 15 6 C 15 3, 10 1, 7 4 C 4 1, -1 3, -1 6 C -1 12, 7 18, 7 18 C 7 18, 15 12, 15 6 Z" fill="#F08080" transform="translate(6, 2)" />
        </Svg>
      </Animated.View>

      {/* 纸飞机漂浮 */}
      <Animated.View style={{ position: 'absolute', left: vx(368), top: planeY, opacity: planeOp }}>
        <Svg width={vs(40)} height={vs(28)} viewBox="0 0 60 42">
          <Path d="M 12 22 L 48 4 L 36 30 Z" fill="#85B7EB" />
          <Path d="M 48 4 L 36 30 L 54 35 Z" fill="#70A0D0" />
          <Path d="M 12 22 L 36 30 L 30 42 Z" fill="#A0C8F0" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** 我的 — 暖粉个人（含动画） */
export function SettingsBackground({ style }: PageBackgroundProps) {
  const { width: screenW } = useWindowDimensions();
  const containerH = 250; // approximate atmosphere height

  // 星星闪烁 (opacity + scale)
  const starPulse = useRef(new Animated.Value(0)).current;
  // 心跳
  const heartBeat = useRef(new Animated.Value(0)).current;
  // 花瓣飘
  const petalWave1 = useRef(new Animated.Value(0)).current;
  const petalWave2 = useRef(new Animated.Value(0)).current;
  const petalWave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(starPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(starPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(heartBeat, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(heartBeat, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    const stagger = (val: Animated.Value, delay: number) => {
      setTimeout(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])).start();
      }, delay);
    };
    stagger(petalWave1, 0);
    stagger(petalWave2, 900);
    stagger(petalWave3, 1800);
  }, []);

  // convert viewBox coords to pixel coords
  const vx = (x: number) => (x / 480) * screenW;
  const vy = (y: number) => (y / 300) * containerH;
  const vs = (s: number) => (s / 480) * screenW;

  // 星闪映射
  const starOpacity = starPulse.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.75] });
  const starScale = starPulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.5, 1] });
  // 心跳映射
  const heartScale = heartBeat.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.35, 1] });
  const heartOpacity = heartBeat.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] });

  return (
    <View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      <Svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        viewBox="0 0 480 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="settingsTint" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFE8E8" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFD8D8" stopOpacity="0.1" />
            <Stop offset="1" stopColor="#FFE0D0" stopOpacity="0.08" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="480" height="300" fill="url(#settingsTint)" />

        <G transform="translate(18, 55)" opacity={0.32}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <Ellipse key={angle} cx={26} cy={16} rx={7} ry={24} fill={angle % 144 === 0 ? '#F4C0D1' : '#FFD0E0'} transform={`rotate(${angle}, 26, 16)`} />
          ))}
          <Circle cx={26} cy={16} r={9} fill="#FAC775" />
          <Circle cx={26} cy={16} r={4.5} fill="#FFE8A0" />
          <Line x1={26} y1={40} x2={26} y2={78} stroke="#E8C0A0" strokeWidth={3} strokeLinecap="round" />
        </G>
        <G transform="translate(375, 118)" opacity={0.32}>
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <Ellipse key={angle} cx={22} cy={13} rx={8} ry={18} fill={angle % 120 === 0 ? '#FFAB91' : '#FFC8A0'} transform={`rotate(${angle}, 22, 13)`} />
          ))}
          <Circle cx={22} cy={13} r={7} fill="#FAC775" />
          <Ellipse cx={40} cy={24} rx={5} ry={12} fill="#80D0A8" transform="rotate(25, 40, 24)" />
          <Ellipse cx={48} cy={18} rx={3} ry={8} fill="#A0E8C8" transform="rotate(10, 48, 18)" />
        </G>
        <G transform="translate(430, 18)" opacity={0.18}>
          <Path d="M 24 2 L 29 19 L 46 19 L 33 31 L 37 50 L 24 38 L 11 50 L 15 31 L 2 19 L 19 19 Z" fill="#FAC775" />
          <Circle cx={24} cy={26} r={7} fill="#FFF0C0" opacity={0.7} />
        </G>
        <G transform="translate(385, 52)" opacity={0.28}>
          <Circle cx={30} cy={22} r={20} fill="#F0C8C0" />
          <Circle cx={25} cy={16} r={5} fill="#FFE8E0" opacity={0.5} />
          <Path d="M 6 58 Q 30 38 54 58 L 54 72 Q 30 62 6 72 Z" fill="#F0C8C0" />
          <Path d="M 20 5 L 24 -2 L 30 4 L 36 -2 L 40 5" fill="none" stroke="#FAC775" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        </G>
        <G transform="translate(130, 58)" opacity={0.3}>
          <Circle cx={20} cy={20} r={18} fill="#FFD0A0" />
          <Circle cx={20} cy={20} r={12} fill="#FFF0D0" />
          <Path d="M 20 9 L 23 15 L 29 15 L 24 19 L 26 27 L 20 22 L 14 27 L 16 19 L 11 15 L 17 15 Z" fill="#FAC775" />
        </G>
        <G transform="translate(80, 145)" opacity={0.28}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <Ellipse key={angle} cx={13} cy={8} rx={5} ry={12} fill={angle % 144 === 0 ? '#AFA9EC' : '#C8C0F0'} transform={`rotate(${angle}, 13, 8)`} />
          ))}
          <Circle cx={13} cy={8} r={5} fill="#FAC775" />
        </G>
        <G transform="translate(325, 170)" opacity={0.28}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <Ellipse key={angle} cx={10} cy={6} rx={3} ry={10} fill={angle % 144 === 0 ? '#5DCAA5' : '#80D8B8'} transform={`rotate(${angle}, 10, 6)`} />
          ))}
          <Circle cx={10} cy={6} r={3.5} fill="#FAC775" />
          <Line x1={10} y1={16} x2={10} y2={35} stroke="#E8C0A0" strokeWidth={1.5} strokeLinecap="round" />
        </G>
        <G opacity={0.16}>
          <Path d="M 275 72 C 275 64, 265 58, 258 64 C 251 58, 241 64, 241 72 C 241 85, 258 96, 258 96 C 258 96, 275 85, 275 72 Z" fill="#FF8A80" />
        </G>
        <G opacity={0.3}>
          <Ellipse cx={300} cy={128} rx={3} ry={7} fill="#AFA9EC" transform="rotate(-45, 300, 128)" />
          <Ellipse cx={390} cy={80} rx={4} ry={8} fill="#F4C0D1" transform="rotate(60, 390, 80)" />
        </G>
        <G opacity={0.25}>
          <Circle cx={120} cy={30} r={4} fill="#FFAB91" />
          <Circle cx={210} cy={48} r={3} fill="#FAC775" />
          <Circle cx={340} cy={22} r={5} fill="#AFA9EC" />
          <Circle cx={415} cy={110} r={3} fill="#F4C0D1" />
          <Circle cx={190} cy={120} r={4} fill="#FAC775" />
          <Circle cx={365} cy={100} r={3} fill="#5DCAA5" />
          <Circle cx={65} cy={100} r={3} fill="#AFA9EC" />
        </G>
      </Svg>

      {/* 星星 */}
      <Animated.View style={{
        position: 'absolute',
        left: vx(435), top: vy(18),
        opacity: starOpacity,
        transform: [{ scale: starScale }],
      }}>
        <Svg width={vs(24)} height={vs(28)} viewBox="0 0 48 52">
          <Path d="M 24 2 L 29 19 L 46 19 L 33 31 L 37 50 L 24 38 L 11 50 L 15 31 L 2 19 L 19 19 Z" fill="#FAC775" />
        </Svg>
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        left: vx(238), top: vy(14),
        opacity: starOpacity,
        transform: [{ scale: starScale }],
      }}>
        <Svg width={vs(14)} height={vs(16)} viewBox="0 0 24 28">
          <Path d="M 12 2 L 14 10 L 22 10 L 16 16 L 18 24 L 12 18 L 6 24 L 8 16 L 2 10 L 10 10 Z" fill="#FAC775" />
        </Svg>
      </Animated.View>

      {/* 心跳爱心 */}
      <Animated.View style={{
        position: 'absolute',
        left: vx(240), top: vy(70),
        transform: [{ scale: heartScale }],
        opacity: heartOpacity,
      }}>
        <Svg width={vs(32)} height={vs(30)} viewBox="0 0 36 36">
          <Path d="M 18 8 C 18 4, 12 2, 8 6 C 4 2, -2 4, -2 8 C -2 14, 8 22, 8 22 C 8 22, 18 14, 18 8 Z" fill="#FF8A80" transform="translate(12, 2)" />
        </Svg>
      </Animated.View>

      {/* 飘动花瓣 */}
      <Animated.View style={{
        position: 'absolute',
        left: vx(150), top: petalWave1.interpolate({ inputRange: [0, 1], outputRange: [vy(80), vy(98)] }),
        opacity: petalWave1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] }),
      }}>
        <Svg width={vs(12)} height={vs(16)} viewBox="0 0 8 14">
          <Ellipse cx={4} cy={7} rx={3.5} ry={6} fill="#FFAB91" transform="rotate(30, 4, 7)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        left: vx(240), top: petalWave2.interpolate({ inputRange: [0, 1], outputRange: [vy(132), vy(148)] }),
        opacity: petalWave2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0.5, 0.2] }),
      }}>
        <Svg width={vs(10)} height={vs(14)} viewBox="0 0 8 14">
          <Ellipse cx={4} cy={7} rx={3.5} ry={6} fill="#5DCAA5" transform="rotate(-30, 4, 7)" />
        </Svg>
      </Animated.View>

      <Animated.View style={{
        position: 'absolute',
        left: vx(380), top: petalWave3.interpolate({ inputRange: [0, 1], outputRange: [vy(72), vy(90)] }),
        opacity: petalWave3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.45, 0.15] }),
      }}>
        <Svg width={vs(10)} height={vs(14)} viewBox="0 0 8 14">
          <Ellipse cx={4} cy={7} rx={3.5} ry={6} fill="#F4C0D1" transform="rotate(60, 4, 7)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
