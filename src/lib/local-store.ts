export default {
  collection: (name: string) => ({
    get: () => Promise.resolve({ docs: [] as any[], empty: true, size: 0 }),
    doc: (id?: string) => ({
      set: (data: any) => Promise.resolve(),
      delete: () => Promise.resolve(),
      get: () => Promise.resolve({ exists: false, data: () => ({} as any) }),
      update: (data: any) => Promise.resolve()
    }),
    orderBy: (field: string, direction?: string) => ({
      limit: (n: number) => ({
        get: () => Promise.resolve({ docs: [] as any[], empty: true, size: 0 })
      }),
      get: () => Promise.resolve({ docs: [] as any[], empty: true, size: 0 })
    }),
    limit: (n: number) => ({
      get: () => Promise.resolve({ docs: [] as any[], empty: true, size: 0 })
    })
  }),
  doc: (path: string) => ({
    set: (data: any) => Promise.resolve(),
    delete: () => Promise.resolve(),
    get: () => Promise.resolve({ exists: false, data: () => ({} as any) }),
    update: (data: any) => Promise.resolve()
  }),
  runTransaction: async (cb: (tx: any) => Promise<any>) => {
    return cb({
      get: (ref: any) => ref.get(),
      update: (ref: any, data: any) => ref.update(data),
      set: (ref: any, data: any) => ref.set(data),
      delete: (ref: any) => ref.delete()
    });
  }
};
