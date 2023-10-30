/**
 * Copyright (c) 2017-present, Wonday (@wonday.org)
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict'
import React, { useEffect, useRef, useState } from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { ViewPropTypes } from 'deprecated-react-native-prop-types'
import PropTypes from 'prop-types'

import PdfManager from './PdfManager'
import PdfPageView from './PdfPageView'
import DoubleTapView from './DoubleTapView'
import PinchZoomView from './PinchZoomView'
import PdfViewFlatList from './PdfViewFlatList'

const MIN_SCALE = 1
const MAX_SCALE = 3

const VIEWABILITYCONFIG = { minimumViewTime: 500, itemVisiblePercentThreshold: 10, waitForInteraction: false }

const PdfView = (props) => {
    const {
        path = '',
        password = '',
        scale: _scale = 1,
        minScale = MIN_SCALE,
        maxScale = MAX_SCALE,
        spacing = 10,
        style = {},
        fitPolicy = 2,
        horizontal = false,
        centerContent: _centerContent = false,
        page: _page = 1,
        currentPage: _currentPage = -1,
        enablePaging = false,
        singlePage = false,
        onPageSingleTap = (page, x, y) => {},
        onScaleChanged = (scale) => {}
    } = props

    const flatListRef = useRef()
    const scaleTimerRef = useRef()
    const scrollTimerRef = useRef()
    const mountedRef = useRef(false)

    const [pdfLoaded, setPdfLoaded] = useState(false)
    const [fileNo, setFileNo] = useState(-1)
    const [numberOfPages, setNumberOfPages] = useState(0)
    const [page] = useState(_page)
    const [currentPage, setCurrentPage] = useState(-1)
    const [pageAspectRate, setPageAspectRate] = useState(0.5)
    const [pdfPageSize, setPdfPageSize] = useState({ width: 0, height: 0 })
    const [contentContainerSize, setContentContainerSize] = useState({ width: 0, height: 0 })
    const [scale, setScale] = useState(props?.scale)
    const [contentOffset, setContentOffset] = useState({ x: 0, y: 0 })
    const [newContentOffset, setNewContentOffset] = useState({ x: 0, y: 0 })
    const [centerContent, setCenterContent] = useState(false)

    useEffect(() => {
        mountedRef.current = true
        PdfManager.loadFile(path, password)
            .then((pdfInfo) => {
                if (mountedRef.current) {
                    const _fileNo = pdfInfo[0]
                    const _numberOfPages = pdfInfo[1]
                    const width = pdfInfo[2]
                    const height = pdfInfo[3]
                    const _pageAspectRatio = height === 0 ? 1 : width / height

                    setPdfLoaded(true)
                    setFileNo(_fileNo)
                    setNumberOfPages(_numberOfPages)
                    setPageAspectRate(_pageAspectRatio)
                    setPdfPageSize({ width, height })
                    setCenterContent(numberOfPages > 1 ? false : true)
                    if (props?.onLoadComplete) {
                        props?.onLoadComplete(numberOfPages, props?.path, { width, height })
                    }
                }
            })
            .catch((error) => {
                props?.onError(error)
            })

        clearTimeout(scrollTimerRef.current)
        scrollTimerRef.current = setTimeout(() => {
            if (flatListRef?.current) {
                flatListRef?.current?.scrollToIndex({ animated: false, index: page < 1 ? 0 : page - 1 })
            }
        }, 200)

        return () => {
            mountedRef.current = false
            clearTimeout(scaleTimerRef?.current)
            clearTimeout(scrollTimerRef?.current)
        }
    }, [])

    useEffect(() => {
        onScaleChanged({
            scale: props?.scale / scale,
            pageX: contentContainerSize.width / 2,
            pageY: contentContainerSize.height / 2
        })
    }, [scale])

    useEffect(() => {
        let page = page < 1 ? 1 : page
        page = page > numberOfPages ? numberOfPages : page

        if (flatListRef?.current) {
            clearTimeout(scrollTimerRef?.current)
            scrollTimerRef.current = setTimeout(() => {
                flatListRef?.current?.scrollToIndex({ animated: false, index: page - 1 })
            }, 200)
        }
    }, [horizontal, page])

    const onLayout = (event) => {
        setContentContainerSize({
            width: event.nativeEvent.layout.width,
            height: event.nativeEvent.layout.height
        })
    }

    const _onScaleChanged = (pinchInfo) => {
        let newScale = pinchInfo?.scale * scale
        newScale = newScale > maxScale ? maxScale : newScale
        newScale = newScale < minScale ? minScale : newScale
        let newContentOffset = {
            x: (contentOffset?.x + pinchInfo?.pageX) * (newScale / scale) - pinchInfo?.pageX,
            y: (contentOffset?.y + pinchInfo?.pageY) * (newScale / scale) - pinchInfo?.pageY
        }
        setScale(newScale)
        setContentOffset(newContentOffset)
        props?.onScaleChanged(newScale)
    }

    const renderSeparator = () => (
        <View
            style={
                horizontal
                    ? {
                          width: spacing * scale,
                          backgroundColor: 'transparent'
                      }
                    : {
                          height: spacing * scale,
                          backgroundColor: 'transparent'
                      }
            }
        />
    )

    const getPageWidth = () => {
        let fitPolicy = props?.fitPolicy

        // if only one page, show whole page in center
        if (numberOfPages === 1 || singlePage) {
            fitPolicy = 2
        }

        switch (fitPolicy) {
            case 0: //fit width
                return contentContainerSize.width * scale
            case 1: //fit height
                return contentContainerSize.height * pageAspectRate * scale
            case 2: //fit both
            default: {
                if (contentContainerSize.width / contentContainerSize.height < pageAspectRate) {
                    return contentContainerSize.width * scale
                } else {
                    return contentContainerSize.height * pageAspectRate * scale
                }
            }
        }
    }

    const getPageHeight = () => {
        let fitPolicy = fitPolicy

        // if only one page, show whole page in center
        if (numberOfPages === 1 || singlePage) {
            fitPolicy = 2
        }

        switch (fitPolicy) {
            case 0: //fit width
                return contentContainerSize.width * (1 / pageAspectRate) * scale
            case 1: //fit height
                return contentContainerSize.height * scale
            case 2: //fit both
            default: {
                if (contentContainerSize.width / contentContainerSize.height < pageAspectRate) {
                    return contentContainerSize.width * (1 / pageAspectRate) * scale
                } else {
                    return contentContainerSize.height * scale
                }
            }
        }
    }

    const onItemSingleTap = (index, x, y) => {
        onPageSingleTap(index + 1, x, y)
    }

    const onItemDoubleTap = (index) => {
        if (scale >= maxScale) {
            _onScaleChanged({
                scale: 1 / scale,
                pageX: contentContainerSize.width / 2,
                pageY: contentContainerSize.height / 2
            })
        } else {
            _onScaleChanged({
                scale: 1.2,
                pageX: contentContainerSize.width / 2,
                pageY: contentContainerSize.height / 2
            })
        }
    }

    const renderItem = ({ item, index }) => {
        const pageView = <PdfPageView accessible key={item.id} fileNo={fileNo} page={item.key + 1} width={getPageWidth()} height={getPageHeight()} />

        if (singlePage) {
            return <View style={{ flexDirection: horizontal ? 'row' : 'column' }}>{pageView}</View>
        }

        return (
            <DoubleTapView
                style={{ flexDirection: horizontal ? 'row' : 'column' }}
                onSingleTap={(x, y) => {
                    onItemSingleTap(index, x, y)
                }}
                onDoubleTap={() => {
                    onItemDoubleTap(index)
                }}>
                {pageView}
                {index !== numberOfPages - 1 && renderSeparator()}
            </DoubleTapView>
        )
    }

    const getItemLayout = (data, index) => ({
        length: horizontal ? getPageWidth() : getPageHeight(),
        offset: ((horizontal ? getPageWidth() : getPageHeight()) + spacing * scale) * index,
        index
    })

    const onViewableItemsChanged = (viewableInfo) => {
        for (let i = 0; i < viewableInfo.viewableItems.length; i++) {
            onPageChanged(viewableInfo.viewableItems[i].index + 1, numberOfPages)
            if (viewableInfo.viewableItems.length + viewableInfo.viewableItems[0].index < numberOfPages) break
        }
    }

    const onPageChanged = (page, numberOfPages) => {
        if (props?.onPageChanged && currentPage !== page) {
            props?.onPageChanged(page, numberOfPages)
            setCurrentPage(page)
        }
    }

    const onScroll = (e) => {
        setContentOffset(e.nativeEvent.contentOffset)
        setNewContentOffset(e.nativeEvent.contentOffset)
    }

    const onListContentSizeChange = (contentWidth, contentHeight) => {
        if (contentOffset.x != newContentOffset.x || contentOffset.y != newContentOffset.y) {
            flatListRef?.current && flatListRef?.current?.scrollToXY(newContentOffset.x, newContentOffset.y)
        }
    }

    const renderList = () => {
        let data = []

        if (singlePage) {
            data[0] = { key: props?.currentPage >= 0 ? props?.currentPage : 0 }
        } else {
            for (let i = 0; i < numberOfPages; i++) {
                data[i] = { key: i }
            }
        }

        return (
            <PdfViewFlatList
                ref={flatListRef}
                style={[styles.container, style]}
                pagingEnabled={enablePaging}
                contentContainerStyle={[
                    {
                        justifyContent: 'center',
                        alignItems: 'center'
                    },
                    horizontal ? { height: contentContainerSize.height * scale } : { width: contentContainerSize.width * scale }
                ]}
                horizontal={horizontal}
                data={data}
                renderItem={renderItem}
                keyExtractor={(_, index) => 'pdf-page-' + index}
                windowSize={11}
                getItemLayout={getItemLayout}
                maxToRenderPerBatch={1}
                renderScrollComponent={(props) => <ScrollView {...props} centerContent={centerContent} pinchGestureEnabled={false} />}
                initialScrollIndex={page < 1 ? 0 : page - 1}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={VIEWABILITYCONFIG}
                onScroll={onScroll}
                onContentSizeChange={onListContentSizeChange}
                scrollEnabled={!singlePage}
            />
        )
    }

    return singlePage ? (
        <View style={styles.container} onLayout={onLayout}>
            {pdfLoaded && renderList()}
        </View>
    ) : (
        <PinchZoomView style={styles.container} onLayout={onLayout} onScaleChanged={_onScaleChanged}>
            {pdfLoaded && renderList()}
        </PinchZoomView>
    )
}

PdfView.propTypes = {
    ...ViewPropTypes,
    path: PropTypes.string,
    password: PropTypes.string,
    scale: PropTypes.number,
    minScale: PropTypes.number,
    maxScale: PropTypes.number,
    spacing: PropTypes.number,
    fitPolicy: PropTypes.number,
    horizontal: PropTypes.bool,
    page: PropTypes.number,
    currentPage: PropTypes.number,
    singlePage: PropTypes.bool,
    onPageSingleTap: PropTypes.func,
    onScaleChanged: PropTypes.func
}

export default PdfView

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})
