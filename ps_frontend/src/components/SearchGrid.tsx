interface SearchGridProps {
  images: string[];
}

export const SearchGrid = ({ images }: SearchGridProps) => {
  return (
    <div className="grid grid-cols-3 gap-1">
      {images.map((image, index) => (
        <button
          key={index}
          className="aspect-square bg-muted overflow-hidden transition-base hover:opacity-80"
        >
          <img
            src={image}
            alt={`Explore post ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
};
