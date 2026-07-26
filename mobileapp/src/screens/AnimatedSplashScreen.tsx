import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const AnimatedSplashScreen = ({ onAnimationFinish }: { onAnimationFinish: () => void }) => {
  // Animated Values
  const particlesY = useRef(new Animated.Value(50)).current;
  const particlesOpacity = useRef(new Animated.Value(0)).current;
  
  const maskWidth = useRef(new Animated.Value(0)).current;
  const schoolBounce = useRef(new Animated.Value(0)).current; // 0 to 1
  
  const tipsTranslateX = useRef(new Animated.Value(50)).current;
  const tipsOpacity = useRef(new Animated.Value(0)).current;
  
  const iconsOpacity = useRef(new Animated.Value(0)).current;
  const iconsScale = useRef(new Animated.Value(0)).current;
  
  const globalOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 0.0s - 0.5s: Particles appear from bottom
      Animated.parallel([
        Animated.timing(particlesY, { toValue: 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(particlesOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // 0.5s - 1.3s: Particles swirl (move up & fade), stroke writes "School" (Mask reveal)
      Animated.parallel([
        Animated.timing(particlesOpacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        Animated.timing(particlesY, { toValue: -50, duration: 800, useNativeDriver: true }),
        Animated.timing(maskWidth, {
          toValue: 250, // enough to reveal the whole word
          duration: 800,
          easing: Easing.out(Easing.exp),
          useNativeDriver: false // width cannot use native driver
        }),
      ]),
      // 1.3s - 2.0s: "School" settles with bounce, "at your tips" slides in
      Animated.parallel([
        Animated.spring(schoolBounce, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(tipsTranslateX, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true
        }),
        Animated.timing(tipsOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        })
      ]),
      // 2.0s - 2.7s: Fingertip icon / touch ripple, tiny icons orbit
      Animated.parallel([
        Animated.timing(iconsOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(iconsScale, { toValue: 1, friction: 5, useNativeDriver: true })
      ]),
      // 2.7s - 3.5s: Icons fade, global fade out
      Animated.parallel([
        Animated.timing(iconsOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(globalOpacity, { toValue: 0, duration: 400, delay: 400, useNativeDriver: true })
      ])
    ]).start(() => {
      onAnimationFinish();
    });
  }, [particlesY, particlesOpacity, maskWidth, schoolBounce, tipsTranslateX, tipsOpacity, iconsOpacity, iconsScale, globalOpacity, onAnimationFinish]);

  const schoolScale = schoolBounce.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1]
  });

  return (
    <Animated.View style={[styles.container, { opacity: globalOpacity }]}>
      
      {/* Particles effect (simulated with glowing dots) */}
      <Animated.View style={[styles.particlesContainer, { opacity: particlesOpacity, transform: [{ translateY: particlesY }] }]}>
         <View style={[styles.particle, { left: -20, top: 15, backgroundColor: '#60A5FA' }]} />
         <View style={[styles.particle, { left: 0, top: -10, backgroundColor: '#F59E0B' }]} />
         <View style={[styles.particle, { left: 25, top: 10, backgroundColor: '#60A5FA' }]} />
      </Animated.View>

      <View style={styles.content}>
         {/* School Text with Mask Reveal */}
         <Animated.View style={[styles.schoolWrapper, { transform: [{ scale: schoolScale }] }]}>
           <Text style={styles.schoolTextHidden}>School</Text>
           <Animated.View style={[styles.maskContainer, { width: maskWidth }]}>
             <Text style={styles.schoolTextVisible}>School</Text>
           </Animated.View>
         </Animated.View>
         
         {/* at your tips */}
         <Animated.View style={[styles.tipsWrapper, { opacity: tipsOpacity, transform: [{ translateX: tipsTranslateX }] }]}>
           <Text style={styles.tipsText}>at your tips</Text>
           
           {/* Ripple / Orbit Icons */}
           <Animated.View style={[styles.orbitCenter, { opacity: iconsOpacity, transform: [{ scale: iconsScale }] }]}>
             <View style={styles.ripple} />
             
             {/* Orbiting Icons */}
             <Text style={[styles.icon, styles.icon1]}>📚</Text>
             <Text style={[styles.icon, styles.icon2]}>🎓</Text>
             <Text style={[styles.icon, styles.icon3]}>✏️</Text>
             <Text style={[styles.icon, styles.icon4]}>💡</Text>
             <Text style={[styles.icon, styles.icon5]}>🏫</Text>
           </Animated.View>
         </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Ensure it sits on top of everything
  },
  content: {
    alignItems: 'center',
    marginTop: -50,
  },
  particlesContainer: {
    position: 'absolute',
    bottom: height * 0.45,
    flexDirection: 'row',
  },
  particle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 3,
  },
  schoolWrapper: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolTextHidden: {
    fontFamily: 'Parisienne-Regular',
    fontSize: 64,
    color: 'transparent', // takes up space so parent sizes correctly
  },
  maskContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  schoolTextVisible: {
    fontFamily: 'Parisienne-Regular',
    fontSize: 64,
    color: '#2563EB',
    width: 250, // wide enough to not clip the word
  },
  tipsWrapper: {
    marginTop: -10,
    alignItems: 'flex-end',
    width: 170, // Ensures text aligns nicely under "School"
  },
  tipsText: {
    fontSize: 18,
    color: '#1E293B',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  orbitCenter: {
    position: 'absolute',
    top: 15,
    right: -25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    opacity: 0.3,
  },
  icon: {
    position: 'absolute',
    fontSize: 16,
  },
  // Positioning in a circle (radius approx 35)
  icon1: { transform: [{ translateX: 0 }, { translateY: -35 }] },
  icon2: { transform: [{ translateX: 33 }, { translateY: -11 }] },
  icon3: { transform: [{ translateX: 21 }, { translateY: 28 }] },
  icon4: { transform: [{ translateX: -21 }, { translateY: 28 }] },
  icon5: { transform: [{ translateX: -33 }, { translateY: -11 }] },
});

export default AnimatedSplashScreen;
