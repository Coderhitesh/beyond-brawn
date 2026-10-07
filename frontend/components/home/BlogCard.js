import Link from 'next/link';
import Img from '@/components/ui/Img';
import { formatDate } from '@/utils/format';

export default function BlogCard({ blog }) {
  return (
    <article className="group relative">
      <div className="relative aspect-[16/9] overflow-hidden bg-black">
        <Img src={blog.coverImage || '/placeholders/blog.svg'} alt="" fill sizes="(min-width:768px) 33vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
      </div>
      <p className="mt-3 text-sm text-mute">
        {blog.category && blog.category.name ? `${blog.category.name}, ` : ''}
        {formatDate(blog.publishedAt)}
        {blog.readMinutes ? `, ${blog.readMinutes} min read` : ''}
      </p>
      <h3 className="mt-1 text-xl font-bold leading-snug">
        <Link href={`/blog/${blog.slug}`} className="after:absolute after:inset-0 hover:underline">
          {blog.title}
        </Link>
      </h3>
      {blog.excerpt && <p className="mt-1.5 line-clamp-2 text-mute">{blog.excerpt}</p>}
    </article>
  );
}
