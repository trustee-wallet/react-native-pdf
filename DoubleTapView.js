'use strict'
import React, { useRef } from 'react'
import { View, PanResponder } from 'react-native'
import PropTypes from 'prop-types'
import { ViewPropTypes } from 'deprecated-react-native-prop-types'

const DoubleTapView = (props) => {
    const prevTouchInfo = useRef({
        prevTouchX: 0,
        prevTouchY: 0,
        prevTouchTimeStamp: 0
    })
    const timer = useRef(null)

    const gestureHandlers = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (e, gestureState) => gestureState.numberActiveTouches === 1,
            onStartShouldSetResponderCapture: (e, gestureState) => gestureState.numberActiveTouches === 1,
            onMoveShouldSetPanResponder: (e, gestureState) => false,
            onMoveShouldSetResponderCapture: (e, gestureState) => false,
            onPanResponderTerminationRequest: (e, gestureState) => false,
            onPanResponderRelease: handlePanResponderRelease
        })
    ).current

    const distance = (x0, y0, x1, y1) => {
        return Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)).toFixed(1)
    }

    const isDoubleTap = (currentTouchTimeStamp, { x0, y0 }) => {
        const { prevTouchX, prevTouchY, prevTouchTimeStamp } = prevTouchInfo.current
        const dt = currentTouchTimeStamp - prevTouchTimeStamp
        const { delay, radius } = props

        return prevTouchTimeStamp > 0 && dt < delay && distance(prevTouchX, prevTouchY, x0, y0) < radius
    }

    const handlePanResponderRelease = (evt, gestureState) => {
        const currentTouchTimeStamp = Date.now()
        const x = evt.nativeEvent.locationX
        const y = evt.nativeEvent.locationY

        if (timer.current) {
            if (isDoubleTap(currentTouchTimeStamp, gestureState)) {
                clearTimeout(timer.current)
                timer.current = null
                props?.onDoubleTap()
            } else {
                const { prevTouchX, prevTouchY, prevTouchTimeStamp } = prevTouchInfo
                const { radius } = props

                // if not in radius, it's a move
                if (distance(prevTouchX, prevTouchY, gestureState.x0, gestureState.y0) < radius) {
                    timer.current = null
                    props?.onSingleTap(x, y)
                }
            }
        } else {
            // do not count scroll gestures as taps
            if (distance(0, gestureState.dx, 0, gestureState.dy) < 10) {
                timer.current = setTimeout(() => {
                    props?.onSingleTap(x, y)
                    timer.current = null
                }, props?.delay)
            }
        }

        prevTouchInfo.current = {
            prevTouchX: gestureState.x0,
            prevTouchY: gestureState.y0,
            prevTouchTimeStamp: currentTouchTimeStamp
        }
    }

    DoubleTapView.propTypes = {
        ...ViewPropTypes,
        delay: PropTypes.number,
        radius: PropTypes.number,
        onSingleTap: PropTypes.func,
        onDoubleTap: PropTypes.func
    }

    DoubleTapView.defaultProps = {
        delay: 300,
        radius: 50,
        onSingleTap: () => {},
        onDoubleTap: () => {}
    }

    return (
        <View {...props} {...gestureHandlers?.panHandlers}>
            {props?.children}
        </View>
    )
}

export default DoubleTapView
