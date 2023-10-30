'use strict'
import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import { View, StyleSheet, PanResponder } from 'react-native'
import { ViewPropTypes } from 'deprecated-react-native-prop-types'

const PinchZoomView = (props) => {
    const distant = useRef(0)
    const gestureHandlers = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: handleStartShouldSetPanResponder,
            onMoveShouldSetResponderCapture: (e, gestureState) => true,
            onMoveShouldSetPanResponder: handleMoveShouldSetPanResponder,
            onPanResponderGrant: handlePanResponderGrant,
            onPanResponderMove: handlePanResponderMove,
            onPanResponderRelease: handlePanResponderEnd,
            onPanResponderTerminationRequest: (e) => false,
            onPanResponderTerminate: handlePanResponderTerminate,
            onShouldBlockNativeResponder: (e) => true
        })
    ).current

    const handleStartShouldSetPanResponder = (e, gestureState) => {
        // don't respond to single touch to avoid shielding click on child components
        return false
    }

    const handleMoveShouldSetPanResponder = (e, gestureState) => {
        return props?.scalable && (e.nativeEvent.changedTouches.length >= 2 || gestureState.numberActiveTouches >= 2)
    }

    const handlePanResponderGrant = (e, gestureState) => {
        if (e.nativeEvent.changedTouches.length >= 2 || gestureState.numberActiveTouches >= 2) {
            let dx = Math.abs(e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX)
            let dy = Math.abs(e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY)
            distant.current = Math.sqrt(dx * dx + dy * dy)
        }
    }

    const handlePanResponderEnd = (e, gestureState) => {
        distant.current = 0
    }

    const handlePanResponderTerminate = (e, gestureState) => {
        distant.current = 0
    }

    const handlePanResponderMove = (e, gestureState) => {
        if ((e.nativeEvent.changedTouches.length >= 2 || gestureState.numberActiveTouches >= 2) && distant?.current > 100) {
            let dx = Math.abs(e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX)
            let dy = Math.abs(e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY)
            let distant = Math.sqrt(dx * dx + dy * dy)
            let scale = distant / distant?.current
            let pageX = (e.nativeEvent.touches[0].pageX + e.nativeEvent.touches[1].pageX) / 2
            let pageY = (e.nativeEvent.touches[0].pageY + e.nativeEvent.touches[1].pageY) / 2
            let pinchInfo = { scale: scale, pageX: pageX, pageY: pageY }

            props?.onScaleChanged(pinchInfo)
            distant.current = distant
        }
    }

    PinchZoomView.propTypes = {
        ...ViewPropTypes,
        scalable: PropTypes.bool,
        onScaleChanged: PropTypes.func
    }

    PinchZoomView.defaultProps = {
        scalable: true,
        onScaleChanged: (scale) => {}
    }

    return (
        <View {...props} {...gestureHandlers?.panHandlers} style={[styles.container, props?.style]}>
            {props?.children}
        </View>
    )
}

export default PinchZoomView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
})
