/// Notation nach
/// https://en.wikipedia.org/wiki/B%C3%A9zier_curve
/// https://en.wikipedia.org/wiki/Composite_B%C3%A9zier_curve

/// cubic bezier curve from P0 to P3 with control points p1, p2
function bezier(p0x, p0y , p1x, p1y , p2x, p2y, p3x, p3y, t) {
//     B(t) = (1-t)^3 * P0 + 3*(1-t)^2 *t* P1 + 3*(1-t) *t^2 *P2 + t^3 *P3

    Bx = (1-t)**3 * p0x + 3*(1-t)**2 *t* p1x + 3*(1-t) *t**2 *p2x + t**3 *p3x
    By = (1-t)**3 * p0y + 3*(1-t)**2 *t* p1y + 3*(1-t) *t**2 *p2y + t**3 *p3y
    return [Bx, By]
}

function tangentenpunkte(Lx, Ly, Ox, Oy, Nx, Ny) {
    let Lx_ = 2*Ox - Lx
    let Ly_ = 2*Oy - Ly
    
    let Nx_ = 2*Ox - Nx
    let Ny_ = 2*Oy - Ny

    let CLx = Lx + 0.5* (Nx_ - Lx)
    let CLy = Ly + 0.5* (Ny_ - Ly)

  // fuck klammer aufloesen !
  const c = 0.2
    let CLxc = (CLx - Ox)* c + Ox
    let CLyc = (CLy - Oy)* c + Oy
    

    let CNx = Nx + 0.5* (Lx_ - Nx)
    let CNy = Ny + 0.5* (Ly_ - Ny)

    let CNxc = (CNx - Ox)* c + Ox
    let CNyc = (CNy - Oy)* c + Oy

//     return [[CLx, CLy], [CNx, CNy]]
    return [[CLxc, CLyc], [CNxc, CNyc]]
//     return [[CNxc, CNyc], [CLxc, CLyc]]
}

function sample_line(x, y, bx, by, n) {
    const dx = (bx - x) * (1/n)
    const dy = (by - y) * (1/n)

    let poses = [[x,y]]
    for (i=1; i<=n; i++) {
        x += dx
        y += dy
        poses[i] = [x,y]
    }
    return poses
}

function sample_bezier(p0x, p0y , p1x, p1y , p2x, p2y, p3x, p3y, n) {
//     log('sample_bezier', p0x, p0y , p1x, p1y , p2x, p2y, p3x, p3y, n)
    log('sample_bezier', [p0x, p0y] , [p3x, p3y], n)
    const dx = 1.0 / n
    let poses = []
    let t=0
    for (i=0; i<=n; i++) {
        t += dx
        poses[i] = bezier(p0x, p0y , p1x, p1y , p2x, p2y, p3x, p3y, t)
    }
//     log('sample_bezier', poses)
    return poses

}
