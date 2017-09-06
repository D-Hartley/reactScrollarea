import React from 'react';
import PropTypes from 'prop-types';
import {Motion, spring} from 'react-motion';
import {modifyObjValues} from './utils';

class ScrollBar extends React.Component {
    constructor(props){
        super(props);
        let newState = this.calculateState(props);
        this.state = {
            position: newState.position,
            scrollSize: newState.scrollSize,
            isDragging: false,
            lastClientPosition: 0
        };

        if(props.type === 'vertical'){
            this.bindedHandleMouseMove = this.handleMouseMoveForVertical.bind(this);
        } else {
            this.bindedHandleMouseMove = this.handleMouseMoveForHorizontal.bind(this);
        }

        this.bindedHandleMouseUp = this.handleMouseUp.bind(this);
    }

    componentDidMount(){
        if (this.props.ownerDocument) {
            this.props.ownerDocument.addEventListener("mousemove", this.bindedHandleMouseMove);
            this.props.ownerDocument.addEventListener("mouseup", this.bindedHandleMouseUp);
        }
    }

    componentWillReceiveProps(nextProps){
        this.setState(this.calculateState(nextProps));
    }

    componentWillUnmount(){
        if (this.props.ownerDocument) {
            this.props.ownerDocument.removeEventListener("mousemove", this.bindedHandleMouseMove);
            this.props.ownerDocument.removeEventListener("mouseup", this.bindedHandleMouseUp);
        }
    }

    calculateFractionalPosition(realContentSize, containerSize, contentPosition){
        let relativeSize = realContentSize - containerSize;

        return 1 - ((relativeSize - contentPosition) / relativeSize);
    }

    calculateState(props){
        let fractionalPosition = this.calculateFractionalPosition(props.realSize, props.containerSize, props.position);
        let proportionalToPageScrollSize = props.containerSize * props.containerSize / props.realSize;
        let scrollSize = proportionalToPageScrollSize < props.minScrollSize ? props.minScrollSize : proportionalToPageScrollSize;

        let scrollPosition = (props.containerSize - scrollSize) * fractionalPosition;
        return {
            scrollSize: scrollSize,
            position: Math.round(scrollPosition)
        };
    }

    render(){
        let {
          containerClassName,
          containerClassNameActive,
          containerClassNameHorizontal,
          containerClassNameVertical,
          containerStyle,
          isDragging,
          scrollbarClassName,
          scrollbarStyle,
          smoothScrolling,
          type,
        } = this.props;
        let isHorizontal = type === 'horizontal';
        let isVertical = type === 'vertical';
        let scrollStyles = this.createScrollStyles();
        let springifiedScrollStyles = smoothScrolling ? modifyObjValues(scrollStyles, x => spring(x)) : scrollStyles;

        containerClassNameActive = isDragging ? containerClassNameActive : '';
        let containerClassNameOrientation = isHorizontal ? containerClassNameHorizontal : containerClassNameVertical;
        let scrollbarContainerClasses = [containerClassName, containerClassNameActive, containerClassNameOrientation].join(' ');

        return (
            <Motion style={springifiedScrollStyles}>
                { style =>
                    <div
                        className={scrollbarContainerClasses}
                        style={containerStyle}
                        onMouseDown={this.handleScrollBarContainerClick.bind(this)}
                        ref={ x => this.scrollbarContainer = x }
                    >
                        <div
                            className={scrollbarClassName}
                            style={{ ...scrollbarStyle, ...style }}
                            onMouseDown={this.handleMouseDown.bind(this)}
                        />
                    </div>
                }
            </Motion>
        );
    }

    handleScrollBarContainerClick(e) {
        e.preventDefault();
        let multiplier = this.computeMultiplier();
        let clientPosition = this.isVertical() ? e.clientY : e.clientX;
        let { top, left } = this.scrollbarContainer.getBoundingClientRect();
        let clientScrollPosition = this.isVertical() ? top : left;

        let position = clientPosition - clientScrollPosition;
        let proportionalToPageScrollSize = this.props.containerSize * this.props.containerSize / this.props.realSize;

        this.setState({isDragging: true, lastClientPosition: clientPosition });
        this.props.onPositionChange((position - proportionalToPageScrollSize / 2) / multiplier);
    }

    handleMouseMoveForHorizontal(e){
        let multiplier = this.computeMultiplier();

        if(this.state.isDragging){
            e.preventDefault();
            let deltaX = this.state.lastClientPosition - e.clientX;
            this.setState({ lastClientPosition: e.clientX });
            this.props.onMove(0, deltaX / multiplier);
        }
    }

    handleMouseMoveForVertical(e){
        let multiplier = this.computeMultiplier();

        if(this.state.isDragging){
            e.preventDefault();
            let deltaY = this.state.lastClientPosition - e.clientY;
            this.setState({ lastClientPosition: e.clientY });
            this.props.onMove(deltaY / multiplier, 0);
        }
    }

    handleMouseDown(e){
        e.preventDefault();
        e.stopPropagation();
        let lastClientPosition = this.isVertical() ? e.clientY: e.clientX;
        this.setState({isDragging: true, lastClientPosition: lastClientPosition });

        this.props.onFocus();
    }

    handleMouseUp(e){
        e.preventDefault();
        this.setState({isDragging: false });
    }

    createScrollStyles(){
        if(this.props.type === 'vertical'){
            return {
                height: this.state.scrollSize,
                marginTop: this.state.position
            };
        } else {
            return {
                width: this.state.scrollSize,
                marginLeft: this.state.position
            };
        }
    }

    computeMultiplier(){
        return (this.props.containerSize) / this.props.realSize;
    }

    isVertical(){
       return this.props.type === 'vertical';
    }
}

ScrollBar.propTypes = {
    containerClassName: PropTypes.string,
    containerClassNameActive: PropTypes.string,
    containerClassNameHorizontal: PropTypes.string,
    containerClassNameVertical: PropTypes.string,
    containerSize: PropTypes.number,
    containerStyle: PropTypes.object,
    minScrollSize: PropTypes.number,
    onFocus: PropTypes.func,
    onMove: PropTypes.func,
    onPositionChange: PropTypes.func,
    ownerDocument: PropTypes.any,
    position: PropTypes.number,
    realSize: PropTypes.number,
    scrollbarClassName: PropTypes.string,
    scrollbarStyle: PropTypes.object,
    smoothScrolling: PropTypes.bool,
    type: PropTypes.oneOf(['vertical', 'horizontal']),
};

ScrollBar.defaultProps = {
    containerClassName: 'scrollbar-container',
    containerClassNameActive: 'scrollbar-container--active',
    containerClassNameHorizontal: 'scrollbar-container--horizontal',
    containerClassNameVertical: 'scrollbar-container--vertical',
    scrollbarClassName: 'scrollbar',
    smoothScrolling: false,
    type : 'vertical',
};
export default ScrollBar;