'use strict'
import React from 'react'
import PropTypes from 'prop-types'
import { requireNativeComponent } from 'react-native'
import { ViewPropTypes } from 'deprecated-react-native-prop-types'

let PdfPageViewCustom = requireNativeComponent('RCTPdfPageView', PdfPageView, { nativeOnly: {} })

const PdfPageView = (props) => {
    const { style, ...restProps } = props
    return <PdfPageViewCustom {...restProps} style={[style, { width: props?.width || '100%', height: props?.height || '100%' }]} />
}

PdfPageView.propTypes = {
    ...ViewPropTypes,
    fileNo: PropTypes.number,
    page: PropTypes.number,
    width: PropTypes.number,
    height: PropTypes.number
}

PdfPageView.defaultProps = {
    style: {}
}

export default React.memo(PdfPageView)
