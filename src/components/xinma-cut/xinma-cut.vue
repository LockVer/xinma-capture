<template>
    <div class="canvas-area">
        <canvas ref="canvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp"
            @mouseleave="handleMouseLeave" @contextmenu.prevent="handleRightClick"></canvas>
        <div class="captureImg">
            <img :src="item" alt="" v-for="item in sortRects(rects)" :key="item">
        </div>
    </div>
</template>
<script src="./xinma-cut.js"></script>
<style lang="scss" scoped src="./xinma-cut.scss"></style>